import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "plutomuntasir@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin
    if (user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ...params } = await req.json();

    switch (action) {
      case "list_users": {
        const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 100 });
        if (error) throw error;

        // Get all plans
        const { data: plans } = await admin.from("user_plans").select("*");
        const planMap = new Map((plans || []).map((p: any) => [p.user_id, p]));

        const result = users.map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          plan_status: planMap.get(u.id)?.plan_status || "free",
          is_banned: planMap.get(u.id)?.is_banned || false,
          scrape_count: planMap.get(u.id)?.scrape_count || 0,
          message_count: planMap.get(u.id)?.message_count || 0,
        }));

        return new Response(JSON.stringify({ users: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_plan": {
        const { user_id, plan_status } = params;
        if (!user_id || !["free", "premium"].includes(plan_status)) {
          return new Response(JSON.stringify({ error: "Invalid params" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await admin.from("user_plans").update({ plan_status, updated_at: new Date().toISOString() }).eq("user_id", user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_ban": {
        const { user_id, is_banned } = params;
        if (!user_id || typeof is_banned !== "boolean") {
          return new Response(JSON.stringify({ error: "Invalid params" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await admin.from("user_plans").update({ is_banned, updated_at: new Date().toISOString() }).eq("user_id", user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_payments": {
        const { data, error } = await admin.from("payment_submissions").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ payments: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "approve_payment": {
        const { payment_id } = params;
        if (!payment_id) {
          return new Response(JSON.stringify({ error: "payment_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Get the payment
        const { data: payment, error: pErr } = await admin.from("payment_submissions").select("*").eq("id", payment_id).single();
        if (pErr || !payment) throw pErr || new Error("Payment not found");

        // Update payment status
        await admin.from("payment_submissions").update({ status: "approved" }).eq("id", payment_id);

        // Upgrade user plan
        await admin.from("user_plans").update({ plan_status: "premium", updated_at: new Date().toISOString() }).eq("user_id", payment.user_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("admin-actions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
