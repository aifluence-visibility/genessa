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

  const [usersResult, profilesResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("id, plan, sector, created_at"),
  ]);

  const profiles = new Map(
    ((profilesResult.data ?? []) as { id: string; plan: string; sector: string | null; created_at: string }[]).map(
      (p) => [p.id, p]
    )
  );

  const users = (usersResult.data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    plan: (profiles.get(u.id)?.plan ?? "free") as "free" | "premium" | "agency",
    sector: profiles.get(u.id)?.sector ?? null,
    created_at: u.created_at,
  }));

  return NextResponse.json({ users });
}
