-- aggregate_engine_scores_for_period(org_id, period_start, period_end)
-- Reads engine_runs + brand_mentions, upserts into engine_scores.
-- Returns number of engine×locale rows written.

create or replace function public.aggregate_engine_scores_for_period(
  p_org_id      uuid,
  p_period_start date,
  p_period_end   date
)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer := 0;
begin
  insert into public.engine_scores (
    organization_id,
    period_start,
    period_end,
    engine,
    target_locale,
    citation_rate,
    share_of_voice,
    source_attribution_rate,
    sentiment_positive_pct,
    sentiment_neutral_pct,
    sentiment_negative_pct
  )
  with
  -- All completed runs for this org in this period
  runs as (
    select
      er.id        as run_id,
      er.engine,
      ep.target_locale
    from public.engine_runs er
    join public.engine_prompts ep on ep.id = er.prompt_id
    where ep.organization_id = p_org_id
      and er.status = 'completed'
      and er.run_timestamp::date between p_period_start and p_period_end
  ),
  -- Per-run own-brand stats
  own_per_run as (
    select
      r.run_id,
      r.engine,
      r.target_locale,
      count(bm.id)                                                        as own_count,
      count(bm.id) filter (where bm.source_url is not null)              as with_source,
      count(bm.id) filter (where bm.sentiment = 'positive')              as positive_count,
      count(bm.id) filter (where bm.sentiment = 'neutral')               as neutral_count,
      count(bm.id) filter (where bm.sentiment = 'negative')              as negative_count
    from runs r
    left join public.brand_mentions bm
           on bm.run_id = r.run_id and bm.is_own_brand = true
    group by r.run_id, r.engine, r.target_locale
  ),
  -- Per-run all-brand count (to compute share of voice)
  all_per_run as (
    select
      r.run_id,
      r.engine,
      r.target_locale,
      count(bm.id) as all_count
    from runs r
    left join public.brand_mentions bm on bm.run_id = r.run_id
    group by r.run_id, r.engine, r.target_locale
  ),
  -- Aggregate across runs per engine×locale
  aggregated as (
    select
      o.engine,
      o.target_locale,
      count(*)                                          as total_runs,
      count(*) filter (where o.own_count > 0)          as cited_runs,
      sum(o.own_count)                                  as total_own,
      sum(a.all_count)                                  as total_all,
      sum(o.with_source)                                as total_sourced,
      sum(o.positive_count)                             as total_positive,
      sum(o.neutral_count)                              as total_neutral,
      sum(o.negative_count)                             as total_negative
    from own_per_run o
    join all_per_run a
      on a.run_id = o.run_id
     and a.engine = o.engine
     and a.target_locale = o.target_locale
    group by o.engine, o.target_locale
  )
  select
    p_org_id,
    p_period_start,
    p_period_end,
    engine,
    target_locale,
    case when total_runs  > 0 then cited_runs::numeric    / total_runs   else 0 end,
    case when total_all   > 0 then total_own::numeric     / total_all    else 0 end,
    case when total_own   > 0 then total_sourced::numeric / total_own    else 0 end,
    case when total_own   > 0 then total_positive::numeric/ total_own    else 0 end,
    case when total_own   > 0 then total_neutral::numeric / total_own    else 0 end,
    case when total_own   > 0 then total_negative::numeric/ total_own    else 0 end
  from aggregated
  on conflict (organization_id, period_start, engine, target_locale)
  do update set
    period_end               = excluded.period_end,
    citation_rate            = excluded.citation_rate,
    share_of_voice           = excluded.share_of_voice,
    source_attribution_rate  = excluded.source_attribution_rate,
    sentiment_positive_pct   = excluded.sentiment_positive_pct,
    sentiment_neutral_pct    = excluded.sentiment_neutral_pct,
    sentiment_negative_pct   = excluded.sentiment_negative_pct,
    created_at               = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.aggregate_engine_scores_for_period is
  'Upserts engine_scores for one org × period. Called by the daily cron for every active org.';


-- Convenience wrapper: aggregate ALL orgs that have completed runs in the period.
-- Returns total rows written across all orgs.
create or replace function public.aggregate_all_engine_scores(
  p_period_start date,
  p_period_end   date
)
returns integer
language plpgsql
security definer
as $$
declare
  v_org_id  uuid;
  v_total   integer := 0;
  v_rows    integer;
begin
  for v_org_id in
    select distinct ep.organization_id
    from public.engine_runs er
    join public.engine_prompts ep on ep.id = er.prompt_id
    where er.status = 'completed'
      and er.run_timestamp::date between p_period_start and p_period_end
  loop
    select public.aggregate_engine_scores_for_period(v_org_id, p_period_start, p_period_end)
    into v_rows;
    v_total := v_total + v_rows;
  end loop;

  return v_total;
end;
$$;

comment on function public.aggregate_all_engine_scores is
  'Iterates all orgs with completed runs in the period and calls aggregate_engine_scores_for_period for each.';
