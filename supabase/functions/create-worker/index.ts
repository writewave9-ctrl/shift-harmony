import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("No authorization header", 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonError("Unauthorized", 401);

    // Verify user is a manager/admin
    const { data: roleData } = await userClient
      .from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!roleData || !["manager", "admin"].includes(roleData.role)) {
      return jsonError("Only managers can add workers", 403);
    }

    // Manager profile (for active team)
    const { data: managerProfile } = await userClient
      .from("profiles")
      .select("id, team_id, active_team_id, organization_id")
      .eq("user_id", user.id).single();

    const teamId = managerProfile?.active_team_id || managerProfile?.team_id;
    if (!teamId) return jsonError("Manager has no active team", 400);

    const body = await req.json();
    const { email, full_name, position } = body;
    if (!email || !full_name) return jsonError("Email and full name required", 400);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ---------- Plan worker-limit enforcement ----------
    const PLAN_LIMITS: Record<string, number> = { starter: 5, pro: 50, enterprise: Number.POSITIVE_INFINITY };
    if (managerProfile?.organization_id) {
      const { data: org } = await adminClient
        .from("organizations").select("plan").eq("id", managerProfile.organization_id).maybeSingle();
      const plan = (org?.plan as string) || "starter";
      const limit = PLAN_LIMITS[plan] ?? 5;
      const { data: countRaw } = await adminClient.rpc("get_org_worker_count", {
        _org_id: managerProfile.organization_id,
      });
      const currentCount = typeof countRaw === "number" ? countRaw : 0;
      if (currentCount >= limit) {
        return jsonError(
          `You've reached the ${plan} plan worker limit (${limit}). Upgrade to add more workers.`,
          402,
        );
      }
    }

    // Check if user with this email already exists
    const { data: existing } = await adminClient.auth.admin.listUsers();
    const existingUser = existing?.users?.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );

    // Use a server-controlled APP_URL for outbound email links to prevent
    // caller-controlled Origin header phishing. Falls back to supabaseUrl.
    const origin = Deno.env.get("APP_URL") || supabaseUrl;

    // ---------- Existing user → invite to additional team ----------
    if (existingUser) {
      // Already in the team?
      const { data: existingMembership } = await adminClient
        .from("team_memberships")
        .select("id, is_active")
        .eq("user_id", existingUser.id)
        .eq("team_id", teamId)
        .maybeSingle();

      if (existingMembership?.is_active) {
        return jsonError(`${email} is already in this team`, 409);
      }

      if (existingMembership && !existingMembership.is_active) {
        // Re-activate
        await adminClient.from("team_memberships")
          .update({ is_active: true })
          .eq("id", existingMembership.id);

        return success({
          existing_user: true,
          message: `${full_name} re-added to the team`,
          email,
          full_name,
        });
      }

      // Create invitation
      const { data: invite, error: inviteErr } = await adminClient
        .from("team_invitations")
        .insert({
          team_id: teamId,
          email: email.toLowerCase(),
          invited_by: managerProfile.id,
          status: "pending",
        })
        .select("token")
        .single();

      if (inviteErr) return jsonError(inviteErr.message, 400);

      const acceptUrl = `${origin}/accept-invite?token=${invite.token}`;

      // Send email via transactional queue (Lovable Email)
      await sendInviteEmail(adminClient, {
        to: email,
        type: "existing_user_invite",
        full_name,
        accept_url: acceptUrl,
      });

      // Notify the existing user in-app
      await adminClient.from("notifications").insert({
        user_id: existingUser.id,
        type: "team_invitation",
        title: "You've been invited to a team",
        message: `Open the invite to join the team. Link: ${acceptUrl}`,
        priority: "high",
      });

      return success({
        existing_user: true,
        invitation_sent: true,
        accept_url: acceptUrl,
        email,
        full_name,
      });
    }

    // ---------- New user → create account + temp password ----------
    const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!";

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role: "worker" },
    });
    if (createError) return jsonError(createError.message, 400);

    // Update profile with team + position
    await adminClient.from("profiles").update({
      team_id: teamId,
      active_team_id: teamId,
      organization_id: managerProfile.organization_id,
      position: position || null,
    }).eq("user_id", newUser.user!.id);

    // Insert team membership
    await adminClient.from("team_memberships").insert({
      user_id: newUser.user!.id,
      team_id: teamId,
    });

    // Send credentials email
    await sendInviteEmail(adminClient, {
      to: email,
      type: "new_user_credentials",
      full_name,
      temp_password: tempPassword,
      sign_in_url: `${origin}/auth`,
    });

    // Manager notification — never persist the temp password in DB rows.
    await adminClient.from("notifications").insert({
      user_id: user.id,
      type: "worker_created",
      title: "Worker account created",
      message: `${full_name} was added — credentials sent by email.`,
      priority: "normal",
    });

    return success({
      existing_user: false,
      worker: {
        id: newUser.user!.id,
        email,
        full_name,
        temp_password: tempPassword,
      },
    });
  } catch (err) {
    console.error("create-worker error:", err);
    return jsonError("Internal server error", 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function success(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface InviteEmailPayload {
  to: string;
  type: "new_user_credentials" | "existing_user_invite";
  full_name: string;
  temp_password?: string;
  sign_in_url?: string;
  accept_url?: string;
}

async function sendInviteEmail(adminClient: any, payload: InviteEmailPayload) {
  // Best effort; log + swallow errors so worker creation always succeeds.
  try {
    const subject = payload.type === "new_user_credentials"
      ? "Welcome to Align — your login details"
      : "You've been invited to join a team on Align";

    const body = payload.type === "new_user_credentials"
      ? buildCredentialsEmail(payload)
      : buildInviteEmail(payload);

    // Try Lovable transactional queue first
    const { error } = await adminClient.rpc("enqueue_email", {
      _purpose: "transactional",
      _to: payload.to,
      _subject: subject,
      _html: body,
      _text: stripHtml(body),
    } as never);

    if (error) {
      console.warn("enqueue_email not available, skipping email:", error.message);
    }
  } catch (err) {
    console.warn("Email send failed:", err);
  }
}

function buildCredentialsEmail(p: InviteEmailPayload) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#ffffff;color:#14181f;">
      <h1 style="font-size:22px;margin:0 0 16px;">Welcome to Align, ${escapeHtml(p.full_name)}</h1>
      <p style="color:#55575d;line-height:1.6;">Your manager created an account for you. Sign in with the credentials below and change your password from the Profile screen.</p>
      <div style="background:#f6f6f4;border:1px solid #e6e6e1;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#55575d;">Email</p>
        <p style="margin:0 0 14px;font-weight:600;">${escapeHtml(p.to)}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#55575d;">Temporary password</p>
        <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-weight:600;">${escapeHtml(p.temp_password || "")}</p>
      </div>
      <a href="${p.sign_in_url}" style="display:inline-block;background:#3b8a7a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">Sign in to Align</a>
    </div>`;
}

function buildInviteEmail(p: InviteEmailPayload) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#ffffff;color:#14181f;">
      <h1 style="font-size:22px;margin:0 0 16px;">You've been invited to a team</h1>
      <p style="color:#55575d;line-height:1.6;">Hi ${escapeHtml(p.full_name)}, a manager invited you to join their team on Align. You can accept the invite below — your existing account stays the same.</p>
      <a href="${p.accept_url}" style="display:inline-block;background:#3b8a7a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;margin:16px 0;">Accept invite</a>
      <p style="color:#9aa0a6;font-size:12px;">If the button doesn't work, paste this link in your browser:<br/><span style="word-break:break-all;">${p.accept_url}</span></p>
    </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function stripHtml(s: string) { return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
