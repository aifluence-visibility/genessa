import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export interface OrgRow {
  id: string;
  name: string;
  domain: string | null;
  locale: string | null;
  extra_query_credits: number;
  prompt_count: number;
  completed_runs: number;
  latest_period: string | null;
  user_email: string | null;
  created_at: string;
}

export async function getAdminOrganizations(): Promise<{ source: "database" | "unavailable"; rows: OrgRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { source: "unavailable", rows: [] };

  // Organizations with credits
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, extra_query_credits, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!orgs || orgs.length === 0) return { source: "database", rows: [] };

  const orgIds = orgs.map((o) => o.id as string);

  // Profiles linked to these orgs (domain + email + locale)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("organization_id, domain, onboarding_locale")
    .in("organization_id", orgIds);

  // Prompt counts per org
  const { data: promptCounts } = await supabase
    .from("engine_prompts")
    .select("organization_id")
    .in("organization_id", orgIds)
    .eq("is_active", true);

  // Completed run counts per org (via prompt → org join)
  const { data: runCounts } = await supabase
    .from("engine_runs")
    .select("prompt_id, engine_prompts!inner(organization_id)")
    .eq("status", "completed")
    .in("engine_prompts.organization_id", orgIds);

  // Latest engine_scores period per org
  const { data: latestScores } = await supabase
    .from("engine_scores")
    .select("organization_id, period_start")
    .in("organization_id", orgIds)
    .order("period_start", { ascending: false })
    .limit(orgIds.length * 6);

  // Auth users for email — query auth.users via admin
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailByUserId = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    if (u.email) emailByUserId.set(u.id, u.email);
  }

  // Build lookup maps
  const profileByOrg = new Map<string, { domain: string | null; locale: string | null; userId: string | null }>();
  for (const p of profiles ?? []) {
    if (!profileByOrg.has(p.organization_id as string)) {
      profileByOrg.set(p.organization_id as string, {
        domain: (p.domain as string | null) ?? null,
        locale: (p.onboarding_locale as string | null) ?? null,
        userId: null,
      });
    }
  }

  // Fetch profile ids to get user_id
  const { data: profileIds } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .in("organization_id", orgIds);

  for (const p of profileIds ?? []) {
    const existing = profileByOrg.get(p.organization_id as string);
    if (existing && !existing.userId) {
      existing.userId = p.id as string;
    }
  }

  const promptCountByOrg = new Map<string, number>();
  for (const p of promptCounts ?? []) {
    const oid = p.organization_id as string;
    promptCountByOrg.set(oid, (promptCountByOrg.get(oid) ?? 0) + 1);
  }

  const runCountByOrg = new Map<string, number>();
  for (const r of runCounts ?? []) {
    const ep = r.engine_prompts as unknown as { organization_id: string } | null;
    if (ep?.organization_id) {
      runCountByOrg.set(ep.organization_id, (runCountByOrg.get(ep.organization_id) ?? 0) + 1);
    }
  }

  const latestPeriodByOrg = new Map<string, string>();
  for (const s of latestScores ?? []) {
    const oid = s.organization_id as string;
    if (!latestPeriodByOrg.has(oid)) {
      latestPeriodByOrg.set(oid, s.period_start as string);
    }
  }

  const rows: OrgRow[] = orgs.map((org) => {
    const profile = profileByOrg.get(org.id as string);
    const email = profile?.userId ? (emailByUserId.get(profile.userId) ?? null) : null;
    return {
      id: org.id as string,
      name: (org.name as string) ?? "—",
      domain: profile?.domain ?? null,
      locale: profile?.locale ?? null,
      extra_query_credits: (org.extra_query_credits as number) ?? 0,
      prompt_count: promptCountByOrg.get(org.id as string) ?? 0,
      completed_runs: runCountByOrg.get(org.id as string) ?? 0,
      latest_period: latestPeriodByOrg.get(org.id as string) ?? null,
      user_email: email,
      created_at: org.created_at as string,
    };
  });

  return { source: "database", rows };
}

export async function updateOrgCredits(orgId: string, delta: number): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "supabase_not_configured" };

  // Fetch current credits
  const { data: org, error: fetchErr } = await supabase
    .from("organizations")
    .select("extra_query_credits")
    .eq("id", orgId)
    .maybeSingle();

  if (fetchErr || !org) return { ok: false, error: fetchErr?.message ?? "not_found" };

  const current = (org.extra_query_credits as number) ?? 0;
  const next = Math.max(0, current + delta);

  const { error } = await supabase
    .from("organizations")
    .update({ extra_query_credits: next })
    .eq("id", orgId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
