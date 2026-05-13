# Stage 1 — Supabase migration plan

Migrations run in lexicographic filename order. Apply with Supabase CLI (`supabase db push` / `supabase migration up`) or paste SQL into the SQL editor in order.

| File | Purpose |
|------|---------|
| `20260513120000_extensions.sql` | `pgcrypto`, `updated_at` trigger helper |
| `20260513120100_core_identity.sql` | `organizations`, `users`, `client_accounts` |
| `20260513120200_leads.sql` | `leads` (optional FK to clients) |
| `20260513120300_engagements.sql` | `engagements` (spine) |
| `20260513120400_leads_converted_engagement.sql` | `leads.converted_engagement_id` → `engagements` |
| `20260513120500_audits_proposals_sprints.sql` | operational shells |
| `20260513120600_tasks_reports.sql` | `tasks`, `report_artifacts` |
| `20260513120700_approvals_activity.sql` | `approval_requests`, `activity_events` |
| `20260513120800_row_level_security.sql` | enable RLS (no policies; service role bypasses; idempotent) |
| `20260513130000_admin_approve_approval_rpc.sql` | `admin_approve_approval_request` RPC (approve + activity event; service_role only) |
| `20260513130100_admin_reject_rerun_rpc.sql` | `admin_reject_approval_request` + `admin_rerun_approval_request` (reject terminal / rerun supersede + task nudge + activity; service_role only) |
| `20260513130200_admin_approve_sync_task.sql` | Approve RPC also sets linked task `approval_state = approved` when task-backed |
| `20260513130300_admin_rerun_followup_approval.sql` | Rerun RPC opens a follow-up `open` approval on the same task/report + activity payload `follow_up_approval_id` |
| `20260513130500_admin_update_task_rpc.sql` | `admin_update_task` RPC (status / `approval_state`; `genessa.actor_label` for activity trigger; `service_role` only) |
| `20260513130600_admin_create_approval_rpc.sql` | `admin_create_approval_request` — open queue row + activity `action: open` (`service_role` only) |
| `20260513130700_report_artifacts_activity.sql` | `report_artifacts_activity_after_update` trigger + `admin_update_report_artifact` RPC (status; `service_role` only) |
| `20260513130800_admin_update_task_guardrails.sql` | `admin_update_task` with transition rules (cancelled immutable, done vs pending) |
| `20260513130900_approval_one_open_per_target.sql` | Partial unique indexes + `admin_create_approval_request` / `admin_rerun_approval_request` guard duplicate open approvals per task/report |
| `20260513131000_internal_auth_rls.sql` | `public.users.auth_user_id` → `auth.users`; `is_internal_operator()`; RLS policies + grants for `authenticated` operators |
| `20260513131100_agent_runs.sql` | `agent_runs` ledger (pending → worker); RLS + operator grants |

Migrations are **idempotent** where PostgreSQL allows it: `IF NOT EXISTS` for tables/indexes, `DROP TRIGGER IF EXISTS` before each `CREATE TRIGGER`, `CREATE OR REPLACE` for `set_updated_at`, and `ADD COLUMN IF NOT EXISTS` for late FK columns. Re-running the bundled SQL after a partial failure should converge the schema without “already exists” errors.

**Note:** The former `20260513120900_engagements_updated_at_trigger.sql` duplicated `engagements_set_updated_at` and has been removed; the trigger is created only in `20260513120300_engagements.sql`.

After migrations, run `supabase/seed.sql` locally (or merge into a `db reset`) to populate demo rows for the admin UI.

## Admin sign-in (migration `310`+)

1. Enable **Email** (or your chosen provider) under Authentication in Supabase.
2. Create an Auth user (Dashboard → Authentication → Users, or `signUp` from the app).
3. Link the Auth user to an internal row (replace emails / use the Auth user id from the dashboard):

```sql
update public.users u
set auth_user_id = (select id from auth.users au where au.email = u.email limit 1)
where u.email = 'a.okonkwo@genessa.internal';
```

Until `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in the Next app, middleware skips protection and `/admin` stays open for local mock UI work. With URL + anon key set, `/admin/*` (except `/admin/login`) requires a valid session and a linked `public.users` row.

## Internal agent runs (migration `311`+)

- **Table** `public.agent_runs`: enqueue asynchronous work per `task_id` with idempotent `run_key` (`{taskId}:{idempotencyKey}`).
- **HTTP** (server-only secret, never in the browser):
  - `POST /api/internal/runs` — body `{ "taskId": "<uuid>", "idempotencyKey"?: string }`, header `x-internal-secret: INTERNAL_API_SECRET`.
  - `PATCH /api/internal/runs/<runId>` — body `{ "status": "running"|"succeeded"|"failed"|"cancelled", "outputSummary"?, "errorMessage"?, "outputRef"? }`, same header. On `succeeded`, optional `outputSummary` is appended to `tasks.output_summary`.
- **Env**: set `INTERNAL_API_SECRET` in `.env.local` (shared with workers/cron).
- **Demo worker**: `npm run worker:agent-demo` claims `pending` rows with optimistic locking (`pending`→`running` must affect a row), completes only from `running`, marks `failed` on thrown errors, retries task summary briefly, and optionally loops with `INTERNAL_WORKER_POLL_MS` (SIGINT/SIGTERM drains gracefully). By default it runs the **`fetch_page_jsonld` tool** (`scripts/tools/fetch-page-jsonld.mjs`): resolves the target from `client_accounts.primary_domain` (via the task’s engagement) or `tasks.metadata.target_url` / `tasks.metadata.agent.target_url`, fetches the page, and records JSON-LD `@type` summaries in `agent_runs.output_ref`. Set `INTERNAL_WORKER_STUB=1` to force the legacy stub without network. If **`OPENAI_API_KEY`** (or `GENESSA_OPENAI_API_KEY`) is set and `INTERNAL_WORKER_LLM` is not `0`, the worker then runs **`consult_brief`** (`scripts/tools/llm-consult-brief.mjs`) — OpenAI Chat Completions with facts grounded only on that tool snapshot; failures are stored under `output_ref.llm.error` and the run still succeeds when the fetch step succeeded. Simulates completion via service role; LLM calls use your OpenAI billing.
- **Admin UI**: Tasks table → **Queue agent run** (server action; no `INTERNAL_API_SECRET` in the browser). Sidebar → **Agent runs** (`/admin/agent-runs`) lists the ledger with optional filters (engagement / status / task id); falls back to mock data when the admin client is unavailable.

## One-command flow (recommended)

From repo root:

```bash
npm run db:setup
```

This **always** regenerates `supabase/_bundle_stage1.sql`, then:

- **Default (safe):** prints the exact **manual SQL Editor** steps (no writes).
- **Optional (local automation):** if `DATABASE_URL` is in `.env.local` and `psql` is installed, run:

  ```bash
  DB_APPLY=1 npm run db:setup
  ```

  This applies the bundle + `supabase/seed.sql` via `psql` with `ON_ERROR_STOP=1`, then runs `db:verify`.

Finally, **`db:setup` runs `npm run db:verify`** unless `SKIP_DB_VERIFY=1`. If you have not applied SQL yet, verify will warn — that is **expected**; the command still exits **0** so local workflows do not look like a hard failure.

## Convenience commands (repo root)

- **`npm run db:setup`** — bundle + manual instructions **or** `psql` apply when `DB_APPLY=1`.
- **`npm run db:bundle`** — writes `supabase/_bundle_stage1.sql` (gitignored) only.
- **`npm run db:verify`** — reads **saved** `.env.local` and checks that `public.organizations` is reachable with the service role key.

### Manual only (Supabase Dashboard)

If you prefer not to use `DATABASE_URL` / `psql`:

1. **SQL Editor → New query** → paste **`supabase/_bundle_stage1.sql`** (from `npm run db:bundle` / `db:setup`) → Run.  
2. **New query** → paste **`supabase/seed.sql`** → Run.

### `.env.local` must be saved on disk

Next.js and `db:verify` only see variables that are **written to `.env.local`**. If Supabase keys exist only in an unsaved editor buffer, save the file before running `db:verify` or `npm run dev`.

### Service role key hygiene

Never commit `SUPABASE_SERVICE_ROLE_KEY` or expose it in the browser. If it has appeared in an insecure channel, **rotate** it in Supabase Dashboard → Settings → API.
