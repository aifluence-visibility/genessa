-- 4.3 Competitor Comparison — RPC function
-- Returns a JSONB snapshot of citation rate + sentiment per brand × engine
-- for a given org over the last N days.
--
-- Usage:
--   select get_competitor_comparison('<org_id>', 30);

create or replace function public.get_competitor_comparison(
  p_org_id    uuid,
  p_days      int  default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff  timestamptz := now() - (p_days || ' days')::interval;
  v_result  jsonb;
begin
  with
  -- Completed runs for this org via prompt_id → engine_prompts
  runs as (
    select er.id, er.engine
    from   public.engine_runs er
    join   public.engine_prompts ep on ep.id = er.prompt_id
    where  ep.organization_id = p_org_id
      and  er.run_timestamp >= v_cutoff
      and  er.status = 'completed'
  ),
  -- Total run count per engine (denominator)
  run_counts as (
    select engine, count(*) as total_runs
    from   runs
    group by engine
  ),
  -- Mentions enriched with engine
  mentions as (
    select
      bm.brand_name,
      bm.is_own_brand,
      bm.sentiment,
      bm.position_in_response,
      r.engine
    from public.brand_mentions bm
    join runs r on r.id = bm.run_id
  ),
  -- Per brand × engine counts
  brand_engine as (
    select
      m.brand_name,
      m.is_own_brand,
      m.engine,
      count(*)                                             as mention_count,
      round(avg(m.position_in_response)::numeric, 1)      as avg_position,
      count(*) filter (where m.sentiment = 'positive')    as pos_count,
      count(*) filter (where m.sentiment = 'neutral')     as neu_count,
      count(*) filter (where m.sentiment = 'negative')    as neg_count
    from mentions m
    group by m.brand_name, m.is_own_brand, m.engine
  ),
  -- Citation rate per brand × engine
  brand_engine_rate as (
    select
      be.*,
      rc.total_runs,
      round(be.mention_count::numeric / rc.total_runs, 3) as citation_rate
    from brand_engine be
    join run_counts rc on rc.engine = be.engine
  ),
  -- Cross-engine totals per brand
  brand_totals as (
    select
      brand_name,
      is_own_brand,
      sum(mention_count)        as total_mentions,
      round(avg(avg_position::numeric), 1) as avg_position,
      sum(pos_count)            as total_pos,
      sum(neu_count)            as total_neu,
      sum(neg_count)            as total_neg
    from brand_engine_rate
    group by brand_name, is_own_brand
  )
  select jsonb_build_object(
    'period_days',  p_days,
    'engines',      (select coalesce(jsonb_agg(engine order by engine), '[]') from run_counts),
    'run_counts',   (select coalesce(jsonb_object_agg(engine, total_runs), '{}') from run_counts),
    'brands', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'name',           bt.brand_name,
          'is_own_brand',   bt.is_own_brand,
          'total_mentions', bt.total_mentions,
          'avg_position',   bt.avg_position,
          'sentiment', jsonb_build_object(
            'positive', case when (bt.total_pos + bt.total_neu + bt.total_neg) > 0
              then round(bt.total_pos::numeric / (bt.total_pos + bt.total_neu + bt.total_neg), 3)
              else 0 end,
            'neutral', case when (bt.total_pos + bt.total_neu + bt.total_neg) > 0
              then round(bt.total_neu::numeric / (bt.total_pos + bt.total_neu + bt.total_neg), 3)
              else 0 end,
            'negative', case when (bt.total_pos + bt.total_neu + bt.total_neg) > 0
              then round(bt.total_neg::numeric / (bt.total_pos + bt.total_neu + bt.total_neg), 3)
              else 0 end
          ),
          'by_engine', (
            select coalesce(jsonb_object_agg(
              ber2.engine,
              jsonb_build_object(
                'mentions',     ber2.mention_count,
                'citation_rate',ber2.citation_rate,
                'avg_position', ber2.avg_position,
                'total_runs',   ber2.total_runs
              )
            ), '{}')
            from brand_engine_rate ber2
            where ber2.brand_name = bt.brand_name
          )
        )
        order by bt.is_own_brand desc, bt.total_mentions desc
      ), '[]')
      from brand_totals bt
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_competitor_comparison(uuid, int) to authenticated, service_role;

comment on function public.get_competitor_comparison(uuid, int) is
  '4.3 Competitor Comparison — aggregates brand_mentions for all brands seen in this org''s engine_runs over the last p_days days. Returns JSONB suitable for report_sections.content_json.';
