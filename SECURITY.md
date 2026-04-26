# Internal Security Notes

> **Audience:** maintainers of this codebase. This document describes the
> intended security model — assumptions other code depends on. Anything
> you change here has cross-cutting impact, so read this *before* editing
> RLS policies, role helpers, or `SECURITY DEFINER` functions.

---

## 1. Role model

Roles live in **`public.user_roles`**, never on `profiles`. The enum
`public.app_role` has three members:

| Role       | Granted to                                  | Capabilities (high level)                                                  |
|------------|---------------------------------------------|----------------------------------------------------------------------------|
| `worker`   | Anyone created via invitation               | CRUD on their own attendance, swap, call-off, and shift-request records.   |
| `manager`  | Anyone who self-signs-up without an invite  | All worker capabilities + management of shifts, team, settings, approvals. |
| `admin`    | Manually granted only                       | Superset of manager. Can manage `user_roles` and `organizations`.          |

**Hard rules** (enforced by `RESTRICTIVE` RLS policies on `user_roles`):

- Only an `admin` may `INSERT`, `UPDATE`, or `DELETE` rows in
  `user_roles`. Workers and managers cannot escalate their own role —
  not through the API, not through any edge function we ship.
- The signup trigger (`handle_new_user_signup`) downgrades `admin` to
  `worker` if it ever appears in `raw_user_meta_data.role`. The only
  ways to become an admin are via direct DB access or another admin.

If you add a new role, add it to the enum *and* update every
`has_role(...)` check site. Search for `has_role(` before merging.

---

## 2. RLS assumptions

Every public-schema table has RLS enabled. Policies follow this shape:

- **Owner-scoped reads** (e.g. `notifications`, `push_subscriptions`,
  `attendance_records` for workers) — `user_id = auth.uid()` or
  `worker_id = get_profile_id(auth.uid())`.
- **Team-scoped reads** (e.g. `shifts`, `shift_messages`,
  `swap_requests`, `team_settings`) — gated by
  `is_member_of_team(auth.uid(), <team>)` against the row's team or its
  parent shift's team.
- **Manager-only writes** — gated by
  `has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin')`,
  always combined with a team-membership check so a manager in team A
  cannot mutate team B's data.
- **Append-only / immutable** tables (`shift_messages`,
  `support_messages`, `attendance_records` deletes,
  `shift_reminders_sent`) — `UPDATE`/`DELETE` policies return `false`
  unconditionally. Don't relax this.

### Realtime ⇒ RLS

Postgres-changes Realtime payloads pass through the same RLS that
`SELECT` does. That means even if the client subscribes to a wide
filter, it will only receive rows it is otherwise allowed to read.
Client code still:

1. Names channels with a `team_id` or `user_id` suffix
   (`shifts:<team_id>`, `notifications:<user_id>`) so different
   tenants don't share Realtime channels across tabs/users.
2. Re-checks identifiers in the handler before showing a toast or
   mutating UI (defence in depth — see `useRealtimeNotifications`).

### Joins that bypass `team_id`

Some tables (`swap_requests`, `call_off_requests`, `shift_requests`,
`shift_messages`, `attendance_records`) have no `team_id` column.
Their RLS policies join through `shifts` to enforce team isolation.
**Never** add a policy on these tables that does not chain through
`shifts.team_id` + `is_member_of_team(...)`.

---

## 3. `SECURITY DEFINER` helpers — usage rules

We use `SECURITY DEFINER` strictly to escape RLS recursion when one
policy needs to read a table that itself has RLS (the textbook example
is `has_role` reading `user_roles` from inside a `user_roles` policy).
All such functions live in `public` and follow the same shape:

```sql
CREATE OR REPLACE FUNCTION public.<name>(...)
RETURNS ...
LANGUAGE sql              -- or plpgsql
STABLE                    -- never VOLATILE unless it must mutate
SECURITY DEFINER
SET search_path = public  -- ALWAYS pin search_path
AS $$ ... $$;
```

**Rules for adding new `SECURITY DEFINER` functions:**

1. **Pin `search_path = public`.** Without this, an attacker who can
   create objects in another schema can shadow tables/functions you
   reference and execute arbitrary code with the owner's privileges.
2. **Take only typed scalar arguments** (`uuid`, `text`, enums). Never
   accept SQL fragments. Never use `EXECUTE` with concatenated input.
3. **Be `STABLE` and read-only when possible.** Reserve writes for
   trigger functions where the side effect is the entire point
   (`handle_new_user_signup`, `notify_*`, `enqueue_due_shift_reminders`,
   `set_ticket_priority_from_plan`).
4. **Return only what the caller is allowed to act on.** `has_role`,
   `is_member_of_team`, and `is_active_team` return booleans. Identity
   helpers (`get_profile_id`, `get_user_team`, `get_user_organization`)
   return scalars derived from `auth.uid()` only.
5. **Never expose secrets.** None of these helpers may return tokens,
   password hashes, push-subscription auth keys, or invitation tokens.
   If you need to read sensitive data inside a definer function, do the
   sensitive comparison *inside* the function and return a boolean.

### Current helper inventory

| Function | Used by | Notes |
|---|---|---|
| `has_role(uuid, app_role)` | All RLS policies | Foundational. Never bypass. |
| `is_member_of_team(uuid, uuid)` | Team-scoped policies | Reads `team_memberships`. |
| `is_active_team(uuid, uuid)` | Active-team gating | Reads `profiles`. |
| `get_user_team(uuid)` / `get_user_active_team(uuid)` | Convenience for policies | Returns the caller's primary team. |
| `get_user_organization(uuid)` | Org-scoped tickets, plans | |
| `get_user_teams(uuid)` | Workspace switcher | Read-only listing. |
| `get_profile_id(uuid)` | Worker-scoped policies | Maps `auth.uid()` → `profiles.id`. |
| `get_org_plan(uuid)` / `get_org_worker_count(uuid)` | Plan limits in edge functions | |
| `get_team_member_directory()` | Worker directory page | Returns only public-safe fields. |
| `handle_updated_at()` | `BEFORE UPDATE` trigger | Standard timestamp bump. |
| `handle_new_user_signup()` | `auth.users` trigger | See §1; downgrades `admin`. |
| `notify_shift_request_changes()` / `notify_swap_request_changes()` | Triggers on requests | Insert into `notifications`. |
| `enqueue_due_shift_reminders()` | Cron via `trigger-shift-reminders` edge fn | Inserts notifications + log rows. |
| `set_ticket_priority_from_plan()` | `BEFORE INSERT` on `support_tickets` | Promotes priority for `enterprise`. |

If you add a function here, add it to the table.

---

## 4. Invitation tokens

Raw invitation tokens are **never** persisted. The flow is:

1. Edge function (`create-worker` or the `useTeamInvitations` hook)
   generates 32 random bytes, hex-encoded.
2. The SHA-256 hex digest of that token is stored in
   `team_invitations.token_hash` (the only column that exists; there
   is no raw `token` column).
3. The raw token is embedded in the accept-invite URL emailed to the
   invitee. It exists in three places: the email, the recipient's
   browser, and (transiently) the edge function memory that issued it.
4. `accept-invite` and the signup trigger hash the incoming token and
   look up by `token_hash`.

Implications:

- A compromised manager account cannot harvest invitation links from
  the database — the column simply isn't there.
- "Resend" cannot reissue the same token; it only extends `expires_at`.
  To rotate a token, cancel and re-create the invitation.
- `team_memberships` `INSERT` policy still requires a valid pending
  invitation matching the user's email — a stolen `team_id` alone is
  not enough.

---

## 5. Edge function conventions

- All functions hash with `sha256Hex` from `crypto.subtle` — never the
  Node `crypto` module, never a third-party library.
- Service-role clients (`SUPABASE_SERVICE_ROLE_KEY`) are scoped to a
  single function invocation. Never re-export them.
- Outbound URLs in emails use `Deno.env.get("APP_URL")` (server-pinned),
  not the request's `Origin` header — caller-controlled origins were a
  phishing risk.
- Errors are logged with `console.error("<context>:", err)` and the
  client receives a generic `"Internal server error"` — never the raw
  exception. The browser's `logger` module redacts further in
  production builds.

---

## 6. When in doubt

- Run `supabase--linter` after any RLS or function change.
- Run `security--run_security_scan` before shipping a release.
- If you find yourself wanting to disable RLS "just for this query",
  write a `SECURITY DEFINER` function that returns the minimum data and
  audit it against §3 instead.
