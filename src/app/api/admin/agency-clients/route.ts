import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

type AgencyDomainRow = {
  id: string;
  domain: string;
  sector: string | null;
  nickname: string | null;
  created_at: string;
};

type ScanRow = {
  domain: string;
  readiness_score: number | null;
  authority_score: number | null;
  influence_score: number | null;
  insight: string | null;
  checklist: unknown;
  issues: unknown;
  created_at: string;
};

export async function GET(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

  const { data: domains, error: domainError } = await admin
    .from("agency_domains")
    .select("id, domain, sector, nickname, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (domainError) return NextResponse.json({ error: domainError.message }, { status: 500 });
  if (!domains || domains.length === 0) return NextResponse.json({ clients: [] });

  const domainList = (domains as AgencyDomainRow[]).map((d) => d.domain);

  const { data: scans } = await admin
    .from("scans")
    .select("domain, readiness_score, authority_score, influence_score, insight, checklist, issues, created_at")
    .in("domain", domainList)
    .order("created_at", { ascending: false });

  const latestScan = new Map<string, ScanRow>();
  for (const scan of (scans ?? []) as ScanRow[]) {
    if (!latestScan.has(scan.domain)) latestScan.set(scan.domain, scan);
  }

  const clients = (domains as AgencyDomainRow[]).map((d) => {
    const scan = latestScan.get(d.domain) ?? null;
    return {
      id: d.id,
      domain: d.domain,
      sector: d.sector,
      nickname: d.nickname,
      created_at: d.created_at,
      lastScan: scan
        ? {
            readiness_score: scan.readiness_score,
            authority_score: scan.authority_score,
            influence_score: scan.influence_score,
            insight: scan.insight,
            checklist: scan.checklist,
            issues: scan.issues,
            created_at: scan.created_at,
          }
        : null,
    };
  });

  return NextResponse.json({ clients });
}
