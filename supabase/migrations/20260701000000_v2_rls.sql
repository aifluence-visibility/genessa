-- ============================================================
-- V2 Row-Level Security — LAUNCH BLOCKER
-- ============================================================
-- Tables: engine_prompts, engine_runs, brand_mentions,
--         engine_scores, tracked_competitors
--
-- Policy model:
--   • Authenticated users can only SELECT rows that belong to
--     their own organization (via profiles.organization_id).
--   • All INSERT / UPDATE / DELETE go through the service-role
--     admin client — no user-facing write policies needed.
--   • SECURITY DEFINER functions and the admin client bypass
--     RLS automatically (they use the service role).
-- ============================================================

-- ── Helper view: current user's org ──────────────────────────

-- We use an inline subquery rather than a function to avoid
-- schema-permission issues with creating functions in auth.*.
-- PostgreSQL caches the result per transaction, so performance
-- is equivalent to a stable function.

-- ── engine_prompts ───────────────────────────────────────────

ALTER TABLE public.engine_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_org_prompts"
  ON public.engine_prompts
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ── engine_runs ──────────────────────────────────────────────
-- Accessible via the owning prompt's organization_id.

ALTER TABLE public.engine_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_org_runs"
  ON public.engine_runs
  FOR SELECT
  TO authenticated
  USING (
    prompt_id IN (
      SELECT id
      FROM public.engine_prompts
      WHERE organization_id = (
        SELECT organization_id
        FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- ── brand_mentions ───────────────────────────────────────────
-- Accessible via run → prompt → organization_id.

ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_org_mentions"
  ON public.brand_mentions
  FOR SELECT
  TO authenticated
  USING (
    run_id IN (
      SELECT er.id
      FROM public.engine_runs er
      JOIN public.engine_prompts ep ON ep.id = er.prompt_id
      WHERE ep.organization_id = (
        SELECT organization_id
        FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- ── engine_scores ────────────────────────────────────────────

ALTER TABLE public.engine_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_org_scores"
  ON public.engine_scores
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ── tracked_competitors ──────────────────────────────────────

ALTER TABLE public.tracked_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_org_competitors"
  ON public.tracked_competitors
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ── organizations ────────────────────────────────────────────
-- Users may read their own org's row (for credits display).

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_org"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );
