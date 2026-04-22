-- 1. Plan enum + columns on organizations
DO $$ BEGIN
  CREATE TYPE public.org_plan AS ENUM ('starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan public.org_plan NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz NOT NULL DEFAULT now();

-- 2. Helper functions
CREATE OR REPLACE FUNCTION public.get_org_plan(_org_id uuid)
RETURNS public.org_plan
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT plan FROM public.organizations WHERE id = _org_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_org_worker_count(_org_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(DISTINCT p.user_id)::int
  FROM public.profiles p
  JOIN public.team_memberships tm ON tm.user_id = p.user_id AND tm.is_active = true
  JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'worker'
  WHERE p.organization_id = _org_id
$$;

-- 3. Idempotent shift creation guard for auto-fill
CREATE UNIQUE INDEX IF NOT EXISTS shifts_team_date_start_position_uniq
  ON public.shifts (team_id, date, start_time, position);

-- 4. Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  opened_by uuid NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Tickets: view by org members
CREATE POLICY "Org members view tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Org members open tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND opened_by = public.get_profile_id(auth.uid())
  );

CREATE POLICY "Managers update tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_organization(auth.uid())
    AND (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Tickets cannot be deleted"
  ON public.support_tickets FOR DELETE TO authenticated USING (false);

-- Messages: org-scoped via ticket
CREATE POLICY "Org members view ticket messages"
  ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND t.organization_id = public.get_user_organization(auth.uid())
  ));

CREATE POLICY "Org members reply to ticket"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = public.get_profile_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND t.organization_id = public.get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Ticket messages cannot be deleted"
  ON public.support_messages FOR DELETE TO authenticated USING (false);

CREATE POLICY "Ticket messages immutable"
  ON public.support_messages FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

-- updated_at trigger for tickets
DROP TRIGGER IF EXISTS support_tickets_set_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_set_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-set priority='priority' when org is enterprise
CREATE OR REPLACE FUNCTION public.set_ticket_priority_from_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT plan FROM public.organizations WHERE id = NEW.organization_id) = 'enterprise' THEN
    NEW.priority := 'priority';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_priority ON public.support_tickets;
CREATE TRIGGER support_tickets_priority
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_priority_from_plan();