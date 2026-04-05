import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple hash for cache key
async function hashQuery(text: string, botId: string): Promise<string> {
  const data = new TextEncoder().encode(`${botId}:${text.toLowerCase().trim()}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// WhatsApp handoff keywords
const HANDOFF_KEYWORDS = ["order", "payment", "buy", "admin", "owner", "human", "talk to someone", "real person", "speak to", "connect me"];

function shouldHandoff(message: string): boolean {
  const lower = message.toLowerCase();
  return HANDOFF_KEYWORDS.some(kw => lower.includes(kw));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, bot_id, origin } = await req.json();
    if (!bot_id || !messages) {
      return new Response(JSON.stringify({ error: "bot_id and messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch bot config
    const { data: bot } = await supabase.from("bots").select("*").eq("id", bot_id).single();
    if (!bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check bot owner's plan for ban & message limits
    const { data: ownerPlan } = await supabase.from("user_plans").select("*").eq("user_id", bot.user_id).maybeSingle();
    if (ownerPlan?.is_banned) {
      return new Response(JSON.stringify({ error: "This bot's owner account has been suspended." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check message limits for free plan
    if (ownerPlan && ownerPlan.plan_status === "free") {
      // Reset monthly count if needed
      const resetDate = new Date(ownerPlan.message_reset_date);
      const now = new Date();
      const needsReset = now.getFullYear() > resetDate.getFullYear() ||
        (now.getFullYear() === resetDate.getFullYear() && now.getMonth() > resetDate.getMonth());
      
      if (needsReset) {
        await supabase.from("user_plans").update({
          message_count: 0,
          message_reset_date: now.toISOString().split("T")[0],
          updated_at: now.toISOString(),
        }).eq("user_id", bot.user_id);
      } else if (ownerPlan.message_count >= 50) {
        return new Response(JSON.stringify({ error: "Monthly message limit reached. Bot owner needs to upgrade to Premium." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Domain whitelist check
    const whitelist = bot.domain_whitelist || [];
    if (origin && whitelist.length > 0) {
      const allowed = whitelist.some((d: string) => origin.includes(d));
      if (!allowed) {
        return new Response(JSON.stringify({ error: "Domain not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";
    const needsHandoff = shouldHandoff(lastUserMsg);

    // Check cache for non-handoff queries
    const queryHash = await hashQuery(lastUserMsg, bot_id);
    if (!needsHandoff) {
      const { data: cached } = await supabase
        .from("cache_responses")
        .select("answer_text")
        .eq("query_hash", queryHash)
        .eq("chatbot_id", bot_id)
        .maybeSingle();

      if (cached) {
        // Return cached response as a fake SSE stream
        const answer = cached.answer_text;
        const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: answer } }] })}\n\ndata: [DONE]\n\n`;
        return new Response(sseData, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }

    const basePrompt = bot.system_prompt || "You are a helpful assistant.";
    const systemPrompt = basePrompt + `\n\nIMPORTANT LANGUAGE RULES:
- You MUST detect the user's language and ALWAYS respond in that same language.
- If the user writes in Bengali (বাংলা), respond entirely in fluent Bengali, even if the knowledge base is in English. Translate relevant information.
- If the user writes in Banglish (Bengali in English letters), respond in Bengali script (বাংলা).
- When you don't have information, respond in the user's language. For Bengali users say: "এই তথ্যটি আমার কাছে নেই, দয়া করে আপনার ফোন নম্বর দিন যাতে আমাদের টিম আপনার সাথে যোগাযোগ করতে পারে।"
- For English users say: "I don't have that information. Please share your phone number so our team can contact you."
- Never mix languages in a single response unless the user does.`;

    // Fetch knowledge items for RAG context
    const { data: knowledge } = await supabase
      .from("knowledge_items")
      .select("source_name, content_text")
      .eq("bot_id", bot_id)
      .limit(10);

    let ragContext = "";
    if (knowledge && knowledge.length > 0) {
      ragContext = "\n\n--- KNOWLEDGE BASE ---\n" +
        knowledge.map((k) => `[${k.source_name}]: ${(k.content_text || "").substring(0, 4000)}`).join("\n\n") +
        "\n--- END KNOWLEDGE BASE ---\n\nAnswer based on the knowledge base above. If the answer is not in the knowledge base, provide the 'I don't have information' fallback in the user's language as instructed.";
    }

    // Add handoff instruction
    let handoffInstruction = "";
    if (needsHandoff && bot.whatsapp_number) {
      handoffInstruction = `\n\nThe user seems to need human assistance. Include [HANDOFF] in your response and suggest they can talk to a real person.`;
    }

    const fullSystemPrompt = systemPrompt + ragContext + handoffInstruction;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // We need to intercept the stream to cache the response
    const originalBody = response.body!;
    const reader = originalBody.getReader();
    let fullAnswer = "";

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          // Cache the response
          if (fullAnswer && !needsHandoff) {
            try {
              await supabase.from("cache_responses").upsert({
                query_hash: queryHash,
                query_text: lastUserMsg,
                answer_text: fullAnswer,
                chatbot_id: bot_id,
              }, { onConflict: "query_hash,chatbot_id" });
            } catch (e) {
              console.error("Cache error:", e);
            }
          }
          // Increment message count for bot owner
          try {
            await supabase.rpc('increment_message_count_raw', { owner_id: bot.user_id });
          } catch {
            // Fallback: direct update
            if (ownerPlan) {
              await supabase.from("user_plans").update({
                message_count: (ownerPlan.message_count || 0) + 1,
                updated_at: new Date().toISOString(),
              }).eq("user_id", bot.user_id);
            }
          }
          // Track conversation
          try {
            const today = new Date().toISOString().split("T")[0];
            await supabase.from("analytics").upsert(
              { bot_id, date: today, total_conversations: 1 },
              { onConflict: "bot_id,date" }
            );
          } catch (e) {
            console.error("Analytics error:", e);
          }
          return;
        }
        // Parse SSE to collect full answer
        const text = new TextDecoder().decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullAnswer += content;
          } catch {}
        }
        controller.enqueue(value);
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Whatsapp-Number": bot.whatsapp_number || "",
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
