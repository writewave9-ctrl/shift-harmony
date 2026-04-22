import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return err("No authorization header", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { team_id } = await req.json();
    if (!team_id) return err("Missing team_id", 400);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get profile id
    const { data: profile } = await admin.from("profiles")
      .select("id, active_team_id, team_id").eq("user_id", user.id).single();
    if (!profile) return err("Profile not found", 404);

    // Unassign from future shifts in this team
    const today = new Date().toISOString().split("T")[0];
    await admin.from("shifts").update({
      assigned_worker_id: null,
      is_vacant: true,
    }).eq("team_id", team_id).eq("assigned_worker_id", profile.id).gte("date", today);

    // Remove membership
    await admin.from("team_memberships")
      .delete().eq("user_id", user.id).eq("team_id", team_id);

    // If this was the active team, switch to another (or null)
    let newActive: string | null = null;
    if ((profile.active_team_id || profile.team_id) === team_id) {
      const { data: nextMembership } = await admin.from("team_memberships")
        .select("team_id").eq("user_id", user.id).limit(1).maybeSingle();
      newActive = nextMembership?.team_id || null;

      await admin.from("profiles").update({
        active_team_id: newActive,
        team_id: newActive, // legacy mirror
      }).eq("user_id", user.id);
    }

    return ok({ left_team_id: team_id, new_active_team_id: newActive });
  } catch (e) {
    console.error("leave-team error:", e);
    return err("Internal server error", 500);
  }
});

function err(m: string, s: number) {
  return new Response(JSON.stringify({ error: m }), {
    status: s, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function ok(d: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...d }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
