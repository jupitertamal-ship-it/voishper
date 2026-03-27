import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, bot_id } = await req.json();
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
    const systemPrompt = bot?.system_prompt || "You are a helpful assistant.";

    // Fetch knowledge items for RAG context
    const { data: knowledge } = await supabase
      .from("knowledge_items")
      .select("source_name, content_text")
      .eq("bot_id", bot_id)
      .limit(10);

    let ragContext = "";
    if (knowledge && knowledge.length > 0) {
      ragContext = "\n\n--- KNOWLEDGE BASE ---\n" +
        knowledge.map((k) => `[${k.source_name}]: ${(k.content_text || "").substring(0, 3000)}`).join("\n\n") +
        "\n--- END KNOWLEDGE BASE ---\n\nAnswer ONLY based on the knowledge base above. If the answer is not in the knowledge base, say you don't know and include [HANDOFF] in your response to trigger human handoff.";
    }

    const fullSystemPrompt = systemPrompt + ragContext;

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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
