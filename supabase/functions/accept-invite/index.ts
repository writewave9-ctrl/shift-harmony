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

    const { token } = await req.json();
    if (!token || typeof token !== "string") return err("Missing invitation token", 400);

    // Hash the incoming raw token; the database never stores the raw form.
    const tokenHash = await sha256Hex(token);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: invite, error: inviteErr } = await admin
      .from("team_invitations")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (inviteErr || !invite) return err("Invalid or expired invitation", 404);
    if (invite.status !== "pending") return err("Invitation already used", 409);
    if (new Date(invite.expires_at) < new Date()) return err("Invitation has expired", 410);
    if ((invite.email || "").toLowerCase() !== (user.email || "").toLowerCase()) {
      return err("This invitation was sent to a different email", 403);
    }

    await admin.from("team_memberships").upsert({
      user_id: user.id,
      team_id: invite.team_id,
      is_active: true,
    }, { onConflict: "user_id,team_id" });

    const { data: team } = await admin
      .from("teams").select("organization_id").eq("id", invite.team_id).single();

    await admin.from("profiles").update({
      active_team_id: invite.team_id,
      organization_id: team?.organization_id,
    }).eq("user_id", user.id);

    await admin.from("team_invitations").update({ status: "accepted" }).eq("id", invite.id);

    return ok({ team_id: invite.team_id });
  } catch (e) {
    console.error("accept-invite error:", e);
    return err("Internal server error", 500);
  }
});

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function err(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function ok(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
