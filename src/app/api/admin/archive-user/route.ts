import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export async function POST(req: Request) {
  const body = await req.json() as { adminSecret?: string; userId?: string; archived?: boolean };
  const { adminSecret, userId, archived } = body;

  if (!adminSecret || adminSecret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userId || typeof archived !== "boolean") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

  const update: { archived: boolean; plan?: string } = { archived };
  if (archived) update.plan = "free";

  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
