import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export async function POST(req: Request) {
  const body = await req.json() as { secret?: string; userId?: string; plan?: string };
  const { secret, userId, plan } = body;

  if (!secret || secret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId || !["free", "premium", "agency"].includes(plan ?? "")) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, plan }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
