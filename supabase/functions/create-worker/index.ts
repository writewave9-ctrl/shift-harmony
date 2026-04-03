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

    // Create client with user's token to verify they're a manager
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
    const { data: roleData } = await userClient.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!roleData || !["manager", "admin"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Only managers can create workers" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get manager's profile for team_id and org_id
    const { data: managerProfile } = await userClient.from("profiles").select("team_id, organization_id").eq("user_id", user.id).single();
    if (!managerProfile?.team_id) {
      return new Response(JSON.stringify({ error: "Manager has no team assigned" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, full_name, position } = body;

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "Email and full name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to create the user
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!";

    // Create the user account
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm so they can log in immediately
      user_metadata: {
        full_name,
        role: "worker",
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the worker's profile with team_id, org_id, and position
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        team_id: managerProfile.team_id,
        organization_id: managerProfile.organization_id,
        position: position || null,
      })
      .eq("user_id", newUser.user!.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Send password reset email so worker can set their own password
    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${req.headers.get("origin") || supabaseUrl}/reset-password`,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
    }

    // Create a notification for the manager
    await adminClient.from("notifications").insert({
      user_id: user.id,
      type: "worker_created",
      title: "Worker account created",
      message: `${full_name} has been added to your team. Temporary password: ${tempPassword}`,
      priority: "normal",
    });

    return new Response(
      JSON.stringify({
        success: true,
        worker: {
          id: newUser.user!.id,
          email,
          full_name,
          temp_password: tempPassword,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
