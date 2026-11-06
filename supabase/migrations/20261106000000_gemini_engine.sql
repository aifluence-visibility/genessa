-- Allow the "gemini" engine in engine_runs / engine_scores and make new prompts
-- target it by default. Idempotent: safe to re-run.
--
-- The original inline CHECK constraints were auto-named by Postgres
-- (<table>_engine_check). We drop and re-create them with gemini added.

alter table public.engine_runs drop constraint if exists engine_runs_engine_check;
alter table public.engine_runs
  add constraint engine_runs_engine_check
  check (engine in ('claude', 'gpt', 'perplexity', 'gemini'));

alter table public.engine_scores drop constraint if exists engine_scores_engine_check;
alter table public.engine_scores
  add constraint engine_scores_engine_check
  check (engine in ('claude', 'gpt', 'perplexity', 'gemini'));

alter table public.engine_prompts
  alter column target_engines set default array['claude', 'gpt', 'perplexity', 'gemini'];

-- OPTIONAL backfill: add gemini to existing prompts so they get Gemini runs too.
-- The worker only tops up missing engine×repeat slots, so this triggers
-- ENGINE_WORKER_REPEATS Gemini calls per prompt (not a re-run of the other
-- engines). Each processed org still consumes 1 query credit per batch.
-- Uncomment to apply:
--
-- update public.engine_prompts
--    set target_engines = array_append(target_engines, 'gemini')
--  where not ('gemini' = any(target_engines));
