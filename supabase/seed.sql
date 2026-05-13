-- Demo dataset for Stage 1 admin UI (safe to re-run on empty project DB only)
begin;

-- Core identity
insert into public.organizations (id, name, slug)
values ('00000001-0000-4000-8000-000000000001', 'Genessa', 'genessa');

insert into public.users (id, organization_id, email, display_name)
values
  ('00000002-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'a.okonkwo@genessa.internal', 'A. Okonkwo'),
  ('00000002-0000-4000-8000-000000000002', '00000001-0000-4000-8000-000000000001', 'l.matsumoto@genessa.internal', 'L. Matsumoto');

insert into public.client_accounts (id, name, primary_domain, sector_pack_key, current_visibility_score)
values
  ('00000003-0000-4000-8000-000000000001', 'NYU', 'nyu.edu', 'edu', 74),
  ('00000003-0000-4000-8000-000000000002', 'Brightline CRM', 'brightlinecrm.com', 'saas', 69),
  ('00000003-0000-4000-8000-000000000003', 'Pacific Bistro Group', 'pacificbistro.com', 'restaurant', 51),
  ('00000003-0000-4000-8000-000000000004', 'Stanford University', 'stanford.edu', 'edu', 68),
  ('00000003-0000-4000-8000-000000000005', 'MIT', 'mit.edu', 'edu', 72),
  ('00000003-0000-4000-8000-000000000006', 'University of Oregon', 'uoregon.edu', 'edu', 61),
  ('00000003-0000-4000-8000-000000000007', 'Helix Analytics', 'helixanalytics.com', 'saas', 66),
  ('00000003-0000-4000-8000-000000000008', 'Metro Hospitality Group', 'metrohospitality.example', 'hotel', 55),
  ('00000003-0000-4000-8000-000000000009', 'Acme Health', 'app.acmehealth.com', 'saas', 59);

-- Engagements
insert into public.engagements (
  id, client_account_id, kind, status, sector_pack_key, roadmap_phase_label, current_sprint_label, metadata
)
values
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', 'delivery', 'active', 'edu', 'Phase 3 of 4', 'Week 6 · Content authority',
    jsonb_build_object('ui', jsonb_build_object('sprint_progress_pct', 68, 'sprint_progress_hint', 'Week 6 of 12'))),
  ('00000004-0000-4000-8000-000000000002', '00000003-0000-4000-8000-000000000002', 'delivery', 'active', 'saas', 'Phase 1 of 4', 'Week 2 · Technical foundation',
    jsonb_build_object('ui', jsonb_build_object('sprint_progress_pct', 24, 'sprint_progress_hint', 'Week 2 of 8'))),
  ('00000004-0000-4000-8000-000000000003', '00000003-0000-4000-8000-000000000003', 'delivery', 'active', 'restaurant', 'Phase 2 of 4', 'Week 4 · Local entity',
    jsonb_build_object('ui', jsonb_build_object('sprint_progress_pct', 42, 'sprint_progress_hint', 'Week 4 of 10'))),
  ('00000004-0000-4000-8000-000000000010', '00000003-0000-4000-8000-000000000004', 'delivery', 'active', 'edu', 'Phase 2 of 4', 'Entity reconciliation sprint',
    '{}'::jsonb),
  ('00000004-0000-4000-8000-000000000011', '00000003-0000-4000-8000-000000000005', 'delivery', 'active', 'edu', 'Phase 1 of 4', 'Schema hardening',
    '{}'::jsonb),
  ('00000004-0000-4000-8000-000000000012', '00000003-0000-4000-8000-000000000006', 'presales', 'paused', 'edu', 'Proposal phase', 'Roadmap finalization',
    '{}'::jsonb),
  ('00000004-0000-4000-8000-000000000013', '00000003-0000-4000-8000-000000000007', 'delivery', 'active', 'saas', 'Phase 2 of 4', 'Instrumentation',
    '{}'::jsonb),
  ('00000004-0000-4000-8000-000000000014', '00000003-0000-4000-8000-000000000008', 'presales', 'draft', 'hotel', 'Pre-kickoff', '—',
    '{}'::jsonb),
  ('00000004-0000-4000-8000-000000000015', '00000003-0000-4000-8000-000000000009', 'delivery', 'active', 'saas', 'Phase 1 of 4', 'Baseline crawl',
    '{}'::jsonb);

-- Leads
insert into public.leads (id, client_account_id, domain, sector, email, score_snapshot, audit_requested, status)
values
  ('00000005-0000-4000-8000-000000000001', null, 'riverside.edu', 'EDU', 'm.chen@riverside.edu', 58, true, 'qualified'),
  ('00000005-0000-4000-8000-000000000002', null, 'brighton-restaurants.com', 'Restaurant', 'ops@brighton-restaurants.com', 42, false, 'new'),
  ('00000005-0000-4000-8000-000000000003', null, 'northernlabs.io', 'SaaS', 'hello@northernlabs.io', 67, true, 'contacted');

-- Audits
insert into public.audits (id, engagement_id, owner_user_id, status, scores_breakdown, updated_at)
values
  ('00000006-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000010', '00000002-0000-4000-8000-000000000001', 'waiting_review', '{"technical":78,"entity":64}'::jsonb, now() - interval '12 minutes'),
  ('00000006-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000011', '00000002-0000-4000-8000-000000000002', 'in_progress', '{}'::jsonb, now() - interval '1 day'),
  ('00000006-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000001', '00000002-0000-4000-8000-000000000001', 'completed', '{}'::jsonb, now() - interval '3 days'),
  ('00000006-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000015', null, 'pending', '{}'::jsonb, now() - interval '5 days');

-- Proposals
insert into public.proposals (id, engagement_id, version, status, duration_label, target_score, pricing_summary, roadmap_snapshot, updated_at)
values
  ('00000007-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000012', 1, 'internal_review', '12 months', 82, '$48k / yr', '{"phases":["technical","entity","content","citation"]}'::jsonb, now()),
  ('00000007-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000013', 1, 'sent', '6 months', 76, '$18k', '{}'::jsonb, now() - interval '2 days'),
  ('00000007-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000014', 1, 'draft', '3 months', 64, '$9.5k', '{}'::jsonb, now() - interval '5 days');

-- Sprints (illustrative)
insert into public.sprints (id, engagement_id, label, status, period_start, period_end, goals_summary)
values
  ('00000008-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001', 'Week 6 · Content authority', 'active', date '2026-05-05', date '2026-05-11', 'Faculty templates + EEAT pass');

-- Tasks
insert into public.tasks (
  id, engagement_id, sprint_id, assignee_user_id, assignee_label, task_type, title, sector, priority, status, approval_state, output_summary
)
values
  ('00000009-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000011', null, null, 'EDU Schema Agent', 'Schema audit', 'CollegeOrUniversity schema gap analysis', 'EDU', 'high', 'in_progress', 'pending', 'Draft findings v2'),
  ('00000009-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000011', null, null, 'EDU Content Authority Agent', 'Content authority', 'Faculty directory EEAT review', 'EDU', 'medium', 'todo', 'not_required', null),
  ('00000009-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000010', null, null, 'EDU Entity Agent', 'Entity authority', 'Wikidata ↔ site entity reconciliation', 'EDU', 'high', 'blocked', 'not_required', 'Awaiting client token'),
  ('00000009-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000002', null, null, 'Manual runbook', 'Technical foundation', 'llms.txt + robots crawl verification', 'SaaS', 'low', 'done', 'approved', 'Signed-off crawl pack');

-- Report artifacts
insert into public.report_artifacts (id, engagement_id, report_type, title, version_label, status, updated_at)
values
  ('0000000a-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000010', 'audit', 'AI Visibility Audit — Stanford', 'v1.3', 'internal_review', now()),
  ('0000000a-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001', 'weekly', 'Weekly sprint summary — NYU', 'W06', 'delivered', now() - interval '1 day'),
  ('0000000a-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000013', 'executive', 'Executive visibility brief — Q2', 'v0.9', 'draft', now() - interval '3 days'),
  ('0000000a-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000012', 'deliverable', 'Citation narrative — AI Overviews', 'draft-01', 'internal_review', now() - interval '2 hours'),
  ('0000000a-0000-4000-8000-000000000005', '00000004-0000-4000-8000-000000000002', 'deliverable', 'Technical findings appendix', 'appendix_technical', 'delivered', now() - interval '1 day');

-- Approvals (each row references exactly one of task_id / report_artifact_id)
insert into public.approval_requests (
  id, engagement_id, task_id, report_artifact_id, title, artifact_label, submitted_by_label, risk, status, submitted_at, resolved_at, context
)
values
  ('0000000b-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000011', '00000009-0000-4000-8000-000000000001', null,
    'CollegeOrUniversity schema gap analysis', 'schema_findings_v2.json', 'EDU Schema Agent', 'medium', 'open', now() - interval '26 minutes', null, '{}'::jsonb),
  ('0000000b-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000012', null, '0000000a-0000-4000-8000-000000000004',
    'Citation narrative — AI Overviews', 'narrative_draft.md', 'Consulting · A. Okonkwo', 'high', 'open', now() - interval '2 hours', null, '{}'::jsonb),
  ('0000000b-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000002', null, '0000000a-0000-4000-8000-000000000005',
    'Technical findings appendix', 'appendix_technical.pdf', 'Manual review', 'low', 'approved', now() - interval '1 day', now() - interval '20 hours', '{}'::jsonb),
  ('0000000b-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000001', null, '0000000a-0000-4000-8000-000000000002',
    'Weekly sprint summary — NYU', 'W06.pdf', 'Consulting', 'low', 'rejected', now() - interval '3 days', now() - interval '2 days', '{}'::jsonb),
  ('0000000b-0000-4000-8000-000000000005', '00000004-0000-4000-8000-000000000013', null, '0000000a-0000-4000-8000-000000000003',
    'Executive visibility brief', 'exec_brief.md', 'L. Matsumoto', 'medium', 'superseded', now() - interval '5 days', now() - interval '1 day',
    jsonb_build_object(
      'lifecycle_closed_as', 'rerun',
      'superseded_at', '2026-05-12T12:00:00Z'
    )),
  ('0000000b-0000-4000-8000-000000000006', '00000004-0000-4000-8000-000000000013', null, '0000000a-0000-4000-8000-000000000003',
    'Executive visibility brief — rework', 'exec_brief.md', 'L. Matsumoto · after rerun', 'medium', 'open', now() - interval '50 minutes', null,
    jsonb_build_object(
      'reopened_after_approval_id', '0000000b-0000-4000-8000-000000000005',
      'reopen_reason', 'rerun'
    ));

-- Activity feed
insert into public.activity_events (engagement_id, event_type, title, detail, actor_label, created_at)
values
  ('00000004-0000-4000-8000-000000000010', 'audit', 'Audit marked waiting review', 'stanford.edu · EDU technical pass', 'System', now() - interval '12 minutes'),
  ('00000004-0000-4000-8000-000000000011', 'approval', 'Approval requested', 'Schema remediation brief · MIT', 'EDU Schema Agent', now() - interval '26 minutes'),
  (null, 'lead', 'New detailed audit request', 'riverside.edu · EDU intake', 'Website', now() - interval '1 hour'),
  ('00000004-0000-4000-8000-000000000001', 'task', 'Task completed', 'Entity map refresh · NYU', 'A. Okonkwo', now() - interval '2 hours'),
  (null, 'engagement', 'Weekly sprint check-in', 'Multiple engagements · goals on track', 'Operations', now() - interval '4 hours');

commit;
