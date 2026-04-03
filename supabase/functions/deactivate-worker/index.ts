import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is a manager/admin
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || !["manager", "admin"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Only managers can deactivate workers" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { worker_profile_id, action } = body;

    if (!worker_profile_id || !["deactivate", "remove"].includes(action)) {
      return new Response(JSON.stringify({ error: "worker_profile_id and action (deactivate/remove) are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get the worker's profile to find their user_id
    const { data: workerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id, full_name, team_id")
      .eq("id", worker_profile_id)
      .single();

    if (profileError || !workerProfile) {
      return new Response(JSON.stringify({ error: "Worker not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify worker is on the same team as the manager
    const { data: managerProfile } = await userClient
      .from("profiles")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (managerProfile?.team_id !== workerProfile.team_id) {
      return new Response(JSON.stringify({ error: "Worker is not on your team" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify target is actually a worker
    const { data: workerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", workerProfile.user_id)
      .maybeSingle();

    if (!workerRole || workerRole.role !== "worker") {
      return new Response(JSON.stringify({ error: "Can only deactivate worker accounts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "deactivate") {
      // Remove worker from team (set team_id to null)
      await adminClient
        .from("profiles")
        .update({ team_id: null, organization_id: null })
        .eq("id", worker_profile_id);

      // Unassign from future scheduled shifts
      const today = new Date().toISOString().split("T")[0];
      await adminClient
        .from("shifts")
        .update({ assigned_worker_id: null, is_vacant: true })
        .eq("assigned_worker_id", worker_profile_id)
        .eq("status", "scheduled")
        .gte("date", today);

      return new Response(
        JSON.stringify({ success: true, message: `${workerProfile.full_name} has been removed from the team` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove") {
      // Remove from team first
      await adminClient
        .from("profiles")
        .update({ team_id: null, organization_id: null })
        .eq("id", worker_profile_id);

      // Unassign from future shifts
      const today = new Date().toISOString().split("T")[0];
      await adminClient
        .from("shifts")
        .update({ assigned_worker_id: null, is_vacant: true })
        .eq("assigned_worker_id", worker_profile_id)
        .eq("status", "scheduled")
        .gte("date", today);

      // Ban/disable the user account
      const { error: banError } = await adminClient.auth.admin.updateUserById(
        workerProfile.user_id,
        { ban_duration: "876600h" } // ~100 years
      );

      if (banError) {
        console.error("Error banning user:", banError);
      }

      return new Response(
        JSON.stringify({ success: true, message: `${workerProfile.full_name} has been removed and deactivated` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
