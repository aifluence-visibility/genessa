import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; domain?: unknown; score?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, domain, score } = body;

  if (typeof email !== "string" || !email.includes("@") || typeof domain !== "string" || !domain) {
    return Response.json({ error: "email and domain are required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return Response.json({ ok: true });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  await supabase.from("leads").insert({
    email,
    domain,
    score_snapshot: typeof score === "number" ? score : null,
  });

  return Response.json({ ok: true });
}
