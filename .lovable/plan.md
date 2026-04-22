

## Goal
Make every line item on the landing-page pricing actually real in the product. Add tier definitions + gating, build the missing features (call-offs, template auto-fill, auto-assign, advanced reports, premium support inbox), and remove "Custom integrations" from the Enterprise tier until there's real demand.

## Pricing → Reality map

| Tier | Feature | Status | Action |
|---|---|---|---|
| Starter | Up to 5 workers | missing | Add limit + enforcement |
| Starter | Basic scheduling | done | — |
| Starter | Push notifications | done | — |
| Starter | Mobile PWA access | done | — |
| Pro | Up to 50 workers | missing | Add limit + enforcement |
| Pro | Shift templates & auto-fill | partial | Build "Generate week from templates" + auto-assign |
| Pro | GPS check-in verification | done | — |
| Pro | Analytics dashboard | done | — |
| Pro | Swap & call-off management | partial | Build call-off UI (table exists) |
| Enterprise | Unlimited workers | missing | Plan flag |
| Enterprise | Multi-team support | done | — |
| Enterprise | Advanced analytics & reports | partial | Add CSV/PDF export + extra report views |
| Enterprise | Priority support | missing | Build in-app support inbox + priority badge |
| Enterprise | Custom integrations | dropping | Remove from landing copy |

## What gets built

### 1. Plan & limits (foundation)
- Migration: add `plan` enum (`starter` | `pro` | `enterprise`) + `plan_started_at` to `organizations`. Default `starter`.
- Migration: SQL helper `get_org_plan(_org_id uuid)` and `get_org_worker_count(_org_id uuid)`.
- Hook `usePlan()` returns `{ plan, limits, workerCount, canInvite, canUseFeature(key) }`.
- Limits: Starter 5, Pro 50, Enterprise ∞. Feature flags per tier (`templates_autofill`, `gps_verification`, `analytics`, `call_offs`, `swaps`, `priority_support`, `report_exports`, `multi_team`).
- `create-worker` edge function rejects with 402 when over limit.
- Inline upgrade banner component shown when blocked.

### 2. Plan management UI
- `Settings → Plan` panel: shows current tier, worker count vs limit, feature checklist, "Upgrade" buttons.
- "Upgrade" buttons currently update `organizations.plan` directly (free toggle) and toast "Billing coming soon — your team is now on Pro." Documented as placeholder so Stripe wiring is one swap later.
- Landing pricing CTAs route to `/auth?plan=starter|pro|enterprise`; signup stores intended plan and applies it after manager creates org.

### 3. Call-off management
- Hook `useCallOffRequests()` (mirrors `useSwapRequests` shape). Already-existing `call_off_requests` table.
- Worker-side: "Call out" button on upcoming shift card → `CallOffModal` with reason picker (sick / family emergency / personal / transportation / other) + custom note.
- Manager-side: new "Call-offs" tab in `ManagerShiftRequests` alongside Pickups and Swaps. Approve = mark shift `is_vacant=true`, unassign worker, post to open shifts. Decline = keep assigned. Reuses `SwapStatusPill`, `SwapTimeline`, drawer pattern.

### 4. Shift template auto-fill
- New page `/manager/shifts/auto-fill` (also reachable from a "Generate week" button on `ManagerShifts`).
- Step 1: pick a week (default = next week).
- Step 2: shows preview list of shifts that will be created from active templates × matching `days_of_week`. User can toggle individual templates off.
- Step 3 (optional): "Auto-assign best fit" — for each generated shift, pick worker with best score = `availability fit (must not be 'blocked') × under weekly_hours_target × highest reliability_score`. Worker assignment runs client-side using existing data; ties broken by lowest assigned hours that week.
- Hook `useShiftAutoFill()` exposes `previewWeek(date)`, `generate({templates, assign})`. Skips dates where a shift from same template+date already exists (idempotent).

### 5. Advanced analytics & reports (Enterprise)
- New section in `ManagerAnalytics` titled "Reports", visible only when `canUseFeature('report_exports')`.
- Exports built client-side (no edge function): 
  - **Shift coverage CSV** (per day: total / filled / vacant / coverage %)
  - **Attendance CSV** (per worker per period: present / late / absent / on-time rate)
  - **Payroll-style hours CSV** (per worker: scheduled hours, completed hours, late minutes)
  - **PDF summary** of the period using `jspdf` + `jspdf-autotable` (charts as images via recharts `ref.toDataURL`)
- Period filter extended: week / month / quarter / custom range.
- Existing dashboard stays free — exports + quarter/custom range are gated.

### 6. Priority support (Enterprise)
- Migration: `support_tickets` table (`id, org_id, opened_by, subject, body, status, priority, created_at, updated_at`) + `support_messages` (`id, ticket_id, sender_id, body, created_at`). RLS: only org members can see their org's tickets; `priority='priority'` auto-set when org plan is Enterprise.
- Settings → Support page: "Open ticket" form + ticket list with thread view.
- Worker-visible "Help" link in profile that opens same form (worker tickets attach to their org).
- For now there's no inbound replies, so the page shows "Average response time: 24h (Enterprise: 2h)" and stores tickets for follow-up.

### 7. Landing-page polish
- Remove "Custom integrations" from Enterprise list, replace with "Dedicated onboarding".
- Add a small "What you get" comparison strip below cards highlighting the actually-shipping limits.
- CTAs: "Get started free" → `/auth?plan=starter`, "Start free trial" → `/auth?plan=pro`, "Contact sales" → opens `mailto:` with subject "Align Enterprise inquiry" (placeholder until support inbox public).
- Apply existing premium tokens (`shadow-elevated`, `bg-gradient-surface`) to the cards for consistency with the rest of the app.

## Technical layout

```text
DB
  +- organizations.plan (enum starter|pro|enterprise, default starter)
  +- organizations.plan_started_at timestamptz
  +- support_tickets (org-scoped, RLS)
  +- support_messages (ticket-scoped, RLS)
  +- get_org_plan(uuid)         -- security definer
  +- get_org_worker_count(uuid) -- security definer

src
  hooks/
    usePlan.ts                  -- {plan, limits, workerCount, canUseFeature, canInvite}
    useCallOffRequests.ts
    useShiftAutoFill.ts
    useSupportTickets.ts
  components/
    PlanBadge.tsx
    UpgradePromptCard.tsx
    CallOffModal.tsx
    AutoFillPreview.tsx
    ReportExportPanel.tsx
    SupportTicketForm.tsx
  pages/
    manager/
      ManagerPlan.tsx           -- Settings sub-route
      ManagerAutoFill.tsx
      ManagerSupport.tsx
      ManagerShiftRequests.tsx  -- gains Call-offs tab
      ManagerAnalytics.tsx      -- gains Reports section
    worker/
      WorkerShifts.tsx          -- "Call out" button on shift card

edge functions
  create-worker (edit)          -- enforce plan worker limit
  generate-report (new, optional) -- only if PDF gets too heavy client-side; default keep client-side
```

Race conditions: auto-fill uses server-side `INSERT ... ON CONFLICT DO NOTHING` against `(team_id, date, start_time, position)` (new partial unique index added in same migration) so two managers triggering simultaneously is safe. Call-off approval uses the same `select-then-update` status guard already proven in swap flow.

## Out of scope (per your answers)
- Real Stripe checkout — plan is a free toggle for now; one edge function added later.
- "Custom integrations" / outbound webhooks / public API — removed from Enterprise tier.

## Files touched (estimate)
~6 new components, 4 new hooks, 3 new pages, 1 migration, 1 edge function edit, 4 page edits, 1 landing edit.

