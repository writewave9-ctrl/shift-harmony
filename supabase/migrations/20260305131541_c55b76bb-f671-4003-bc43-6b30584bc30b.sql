
-- CRITICAL FIX: All policies were RESTRICTIVE only. PostgreSQL requires at least one PERMISSIVE policy
-- to grant access. Restrictive-only means NO rows returned to anyone.
-- Convert SELECT/data-access policies to PERMISSIVE while keeping deny policies as RESTRICTIVE.

-- ═══════ profiles ═══════
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Managers can view team profiles" ON public.profiles FOR SELECT USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND team_id = get_user_team(auth.uid())
);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Only admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══════ user_roles ═══════
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their initial role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their initial role" ON public.user_roles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══════ organizations ═══════
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;

CREATE POLICY "Users can view their organization" ON public.organizations FOR SELECT USING (id = get_user_organization(auth.uid()));
CREATE POLICY "Admins can manage organizations" ON public.organizations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══════ teams ═══════
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Managers and admins can manage teams" ON public.teams;

CREATE POLICY "Users can view teams in their organization" ON public.teams FOR SELECT USING (organization_id = get_user_organization(auth.uid()));
CREATE POLICY "Managers and admins can manage teams" ON public.teams FOR ALL USING (
  organization_id = get_user_organization(auth.uid())
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- ═══════ shifts ═══════
DROP POLICY IF EXISTS "Users can view shifts in their team" ON public.shifts;
DROP POLICY IF EXISTS "Managers can manage shifts" ON public.shifts;

CREATE POLICY "Users can view shifts in their team" ON public.shifts FOR SELECT USING (team_id = get_user_team(auth.uid()));
CREATE POLICY "Managers can manage shifts" ON public.shifts FOR ALL USING (
  team_id = get_user_team(auth.uid())
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- ═══════ notifications ═══════
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Managers can create notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Managers can create notifications" ON public.notifications FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid()
);

-- ═══════ attendance_records ═══════
DROP POLICY IF EXISTS "Workers can view own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Managers can manage attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Workers can check in to their own assigned shifts" ON public.attendance_records;
DROP POLICY IF EXISTS "Workers can update their own attendance" ON public.attendance_records;
-- Keep the restrictive delete deny policy

CREATE POLICY "Workers can view own attendance" ON public.attendance_records FOR SELECT USING (
  worker_id = get_profile_id(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Managers can manage attendance" ON public.attendance_records FOR ALL USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (SELECT 1 FROM shifts s WHERE s.id = attendance_records.shift_id AND s.team_id = get_user_team(auth.uid()))
);
CREATE POLICY "Workers can check in to their own assigned shifts" ON public.attendance_records FOR INSERT WITH CHECK (
  worker_id = get_profile_id(auth.uid())
  AND EXISTS (SELECT 1 FROM shifts s WHERE s.id = attendance_records.shift_id AND s.assigned_worker_id = attendance_records.worker_id)
);
CREATE POLICY "Workers can update their own attendance" ON public.attendance_records FOR UPDATE USING (worker_id = get_profile_id(auth.uid()));

-- ═══════ swap_requests ═══════
DROP POLICY IF EXISTS "Users can view swap requests in their team" ON public.swap_requests;
DROP POLICY IF EXISTS "Workers can create swap requests" ON public.swap_requests;
DROP POLICY IF EXISTS "Managers can manage swap requests" ON public.swap_requests;
-- Keep restrictive delete deny

CREATE POLICY "Users can view swap requests in their team" ON public.swap_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM shifts s WHERE s.id = swap_requests.shift_id AND s.team_id = get_user_team(auth.uid()))
);
CREATE POLICY "Workers can create swap requests" ON public.swap_requests FOR INSERT WITH CHECK (requester_id = get_profile_id(auth.uid()));
CREATE POLICY "Managers can manage swap requests" ON public.swap_requests FOR UPDATE USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (SELECT 1 FROM shifts s WHERE s.id = swap_requests.shift_id AND s.team_id = get_user_team(auth.uid()))
);

-- ═══════ call_off_requests ═══════
DROP POLICY IF EXISTS "Workers see own call-offs, managers see team" ON public.call_off_requests;
DROP POLICY IF EXISTS "Workers can create call-off requests" ON public.call_off_requests;
DROP POLICY IF EXISTS "Managers can manage call-off requests" ON public.call_off_requests;
-- Keep restrictive delete deny

CREATE POLICY "Workers see own call-offs managers see team" ON public.call_off_requests FOR SELECT USING (
  worker_id = get_profile_id(auth.uid())
  OR ((has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    AND EXISTS (SELECT 1 FROM shifts s WHERE s.id = call_off_requests.shift_id AND s.team_id = get_user_team(auth.uid())))
);
CREATE POLICY "Workers can create call-off requests" ON public.call_off_requests FOR INSERT WITH CHECK (worker_id = get_profile_id(auth.uid()));
CREATE POLICY "Managers can manage call-off requests" ON public.call_off_requests FOR UPDATE USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (SELECT 1 FROM shifts s WHERE s.id = call_off_requests.shift_id AND s.team_id = get_user_team(auth.uid()))
);

-- ═══════ shift_requests ═══════
DROP POLICY IF EXISTS "Workers can view their own requests" ON public.shift_requests;
DROP POLICY IF EXISTS "Managers can view all team shift requests" ON public.shift_requests;
DROP POLICY IF EXISTS "Workers can create shift requests" ON public.shift_requests;
DROP POLICY IF EXISTS "Managers can update shift requests" ON public.shift_requests;
-- Keep restrictive delete deny

CREATE POLICY "Workers can view their own requests" ON public.shift_requests FOR SELECT USING (worker_id = get_profile_id(auth.uid()));
CREATE POLICY "Managers can view all team shift requests" ON public.shift_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM shifts s WHERE s.id = shift_requests.shift_id AND s.team_id = get_user_team(auth.uid()))
);
CREATE POLICY "Workers can create shift requests" ON public.shift_requests FOR INSERT WITH CHECK (worker_id = get_profile_id(auth.uid()));
CREATE POLICY "Managers can update shift requests" ON public.shift_requests FOR UPDATE USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (SELECT 1 FROM shifts s WHERE s.id = shift_requests.shift_id AND s.team_id = get_user_team(auth.uid()))
);

-- ═══════ shift_messages ═══════
DROP POLICY IF EXISTS "Users can view messages for their team shifts" ON public.shift_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.shift_messages;
-- Keep restrictive update/delete deny policies

CREATE POLICY "Users can view messages for their team shifts" ON public.shift_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM shifts s WHERE s.id = shift_messages.shift_id AND s.team_id = get_user_team(auth.uid()))
);
CREATE POLICY "Users can send messages" ON public.shift_messages FOR INSERT WITH CHECK (sender_id = get_profile_id(auth.uid()));

-- ═══════ shift_templates ═══════
DROP POLICY IF EXISTS "Users can view templates in their team" ON public.shift_templates;
DROP POLICY IF EXISTS "Managers can manage templates" ON public.shift_templates;

CREATE POLICY "Users can view templates in their team" ON public.shift_templates FOR SELECT USING (team_id = get_user_team(auth.uid()));
CREATE POLICY "Managers can manage templates" ON public.shift_templates FOR ALL USING (
  team_id = get_user_team(auth.uid())
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- ═══════ team_settings ═══════
DROP POLICY IF EXISTS "Users can view their team settings" ON public.team_settings;
DROP POLICY IF EXISTS "Managers can manage team settings" ON public.team_settings;

CREATE POLICY "Users can view their team settings" ON public.team_settings FOR SELECT USING (team_id = get_user_team(auth.uid()));
CREATE POLICY "Managers can manage team settings" ON public.team_settings FOR ALL USING (
  team_id = get_user_team(auth.uid())
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- ═══════ team_invitations ═══════
DROP POLICY IF EXISTS "Managers can manage team invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Managers can view team invitations" ON public.team_invitations;

CREATE POLICY "Managers can manage team invitations" ON public.team_invitations FOR ALL USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND team_id = get_user_team(auth.uid())
);
CREATE POLICY "Users can view their own invitations" ON public.team_invitations FOR SELECT USING (
  ((has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    AND team_id = get_user_team(auth.uid()))
  OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
);

-- ═══════ availability_settings ═══════
DROP POLICY IF EXISTS "Workers can manage their own availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Workers can view their own availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Managers can view team availability" ON public.availability_settings;

CREATE POLICY "Workers can manage their own availability" ON public.availability_settings FOR ALL USING (worker_id = get_profile_id(auth.uid()));
CREATE POLICY "Managers can view team availability" ON public.availability_settings FOR SELECT USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = availability_settings.worker_id AND p.team_id = get_user_team(auth.uid()))
);

-- ═══════ push_subscriptions ═══════
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can create own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid());
