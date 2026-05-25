import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export async function GET(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const [usersResult, profilesResult, scansResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("id, plan, sector, created_at, archived"),
    admin.from("scans").select("user_id, created_at").order("created_at", { ascending: false }),
  ]);

  const profiles = new Map(
    ((profilesResult.data ?? []) as { id: string; plan: string; sector: string | null; created_at: string; archived: boolean | null }[]).map(
      (p) => [p.id, p]
    )
  );

  const lastScanMap = new Map<string, string>();
  for (const scan of (scansResult.data ?? []) as { user_id: string; created_at: string }[]) {
    if (!lastScanMap.has(scan.user_id)) {
      lastScanMap.set(scan.user_id, scan.created_at);
    }
  }

  const users = (usersResult.data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    plan: (profiles.get(u.id)?.plan ?? "free") as "free" | "starter" | "pro" | "agency" | "consulting",
    sector: profiles.get(u.id)?.sector ?? null,
    created_at: u.created_at,
    lastScan: lastScanMap.get(u.id) ?? null,
    archived: profiles.get(u.id)?.archived ?? false,
  }));

  return NextResponse.json({ users });
}
