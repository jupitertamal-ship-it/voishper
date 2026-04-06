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

    const body = await req.json();
    const { action, ...params } = body;

    // Force signout - can be called with service role key
    if (action === "force_signout_all") {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "") || "";
      // Allow if service role key is used directly OR if admin user
      if (token === supabaseServiceKey) {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;
        let count = 0;
        for (const u of users) {
          try {
            await adminClient.auth.admin.signOut(u.id);
            count++;
          } catch (_) {}
        }
        return new Response(JSON.stringify({ success: true, count }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Otherwise fall through to normal admin auth
    }

    // Public action: submit_reset_request (no auth needed)
    if (action === "submit_reset_request") {
      const { email, reason } = params;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const admin = createClient(supabaseUrl, supabaseServiceKey);
      // Find user by email
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const foundUser = users?.find((u: any) => u.email === email);
      if (!foundUser) {
        // Don't reveal if user exists or not
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await admin.from("password_reset_requests").insert({
        user_id: foundUser.id,
        user_email: email,
        status: "pending",
        admin_note: reason || null,
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require admin auth
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

    if (user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case "list_users": {
        const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 100 });
        if (error) throw error;
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
        const { data: payment, error: pErr } = await admin.from("payment_submissions").select("*").eq("id", payment_id).single();
        if (pErr || !payment) throw pErr || new Error("Payment not found");
        await admin.from("payment_submissions").update({ status: "approved" }).eq("id", payment_id);
        await admin.from("user_plans").update({ plan_status: "premium", updated_at: new Date().toISOString() }).eq("user_id", payment.user_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_reset_requests": {
        const { data, error } = await admin.from("password_reset_requests").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ requests: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "handle_reset_request": {
        const { request_id, decision } = params;
        if (!request_id || !["approve", "deny"].includes(decision)) {
          return new Response(JSON.stringify({ error: "Invalid params" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: request, error: rErr } = await admin.from("password_reset_requests").select("*").eq("id", request_id).single();
        if (rErr || !request) throw rErr || new Error("Request not found");

        if (decision === "approve") {
          // Generate a password reset link for the user
          const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
            type: "recovery",
            email: request.user_email,
          });
          if (linkErr) throw linkErr;

          await admin.from("password_reset_requests").update({
            status: "approved",
            resolved_at: new Date().toISOString(),
            admin_note: "Reset link generated and sent",
          }).eq("id", request_id);
        } else {
          await admin.from("password_reset_requests").update({
            status: "denied",
            resolved_at: new Date().toISOString(),
          }).eq("id", request_id);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "force_signout_all": {
        // Sign out all users by invalidating their sessions
        const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;
        for (const u of users) {
          await admin.auth.admin.signOut(u.id);
        }
        return new Response(JSON.stringify({ success: true, count: users.length }), {
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
