import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function cleanHtml(html: string): string {
  return html
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient: createAuthClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const authSupabase = createAuthClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check ban & plan limits
    const { data: userPlan } = await adminClient.from("user_plans").select("*").eq("user_id", user.id).maybeSingle();
    if (userPlan?.is_banned) {
      return new Response(JSON.stringify({ error: "Your account has been suspended." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, bot_id, preview_only } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check scrape limit for free users (only for non-preview)
    if (!preview_only && userPlan && userPlan.plan_status === "free" && userPlan.scrape_count >= 1) {
      return new Response(JSON.stringify({ error: "Free plan limit reached. Upgrade to Premium for unlimited scraping." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    let content = "";
    let sourceName = url;

    // Use Jina Reader API for clean content extraction
    try {
      const jinaResp = await fetch(`https://r.jina.ai/${formattedUrl}`, {
        headers: { Accept: "text/plain" },
      });
      if (jinaResp.ok) {
        content = await jinaResp.text();
        // Extract title from first line if markdown
        const firstLine = content.split("\n")[0];
        if (firstLine.startsWith("# ")) {
          sourceName = firstLine.replace("# ", "").trim();
        }
      }
    } catch {
      // Jina failed, fallback to direct fetch
    }

    // Fallback: direct fetch + HTML cleaning
    if (!content) {
      try {
        const resp = await fetch(formattedUrl);
        const html = await resp.text();
        content = cleanHtml(html);
        // Try to extract title
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch) sourceName = titleMatch[1].trim();
      } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to fetch URL" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    content = content.substring(0, 100000);

    // If preview_only, return content without storing
    if (preview_only) {
      return new Response(JSON.stringify({
        success: true,
        source_name: sourceName,
        content_text: content,
        content_length: content.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!bot_id) {
      return new Response(JSON.stringify({ error: "bot_id required for storage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store in knowledge_items

    const { error } = await adminClient.from("knowledge_items").insert({
      bot_id,
      type: "url",
      source_name: sourceName,
      content_text: content,
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      source_name: sourceName,
      content_length: content.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
