import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

const SECTOR_AGENTS: Record<string, { name: string; sectorLabel: string }> = {
  restaurant: { name: "Savor", sectorLabel: "Restaurant" },
  hotel: { name: "Haven", sectorLabel: "Hospitality" },
  clinic: { name: "Vita", sectorLabel: "Medical" },
  saas: { name: "Nexus", sectorLabel: "SaaS" },
  ecommerce: { name: "Flux", sectorLabel: "Commerce" },
  creator: { name: "Lumen", sectorLabel: "Creator" },
  legal: { name: "Vero", sectorLabel: "Legal" },
};

function getAgent(sector: string | null) {
  const entry = sector ? SECTOR_AGENTS[sector] : null;
  return entry ?? { name: "Genessa", sectorLabel: "AI Visibility" };
}

function buildHtml(body: string, agentName: string, sectorLabel: string) {
  const bodyHtml = body.replace(/\n/g, "<br>");
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:32px">
    <strong style="font-size:18px">${agentName}</strong>
    <span style="color:#6B7280;font-size:13px"> — Genessa ${sectorLabel} Intelligence</span>
  </div>
  <div style="font-size:15px;line-height:1.7;color:#111827">${bodyHtml}</div>
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #E5E7EB">
    <p style="color:#6B7280;font-size:12px;margin:0">
      The ${agentName} Team | Powered by Genessa<br>
      <a href="https://genessa.ai" style="color:#6B7280">genessa.ai</a>
    </p>
  </div>
</div>`;
}

export async function POST(req: Request) {
  const { subject, body, audience, adminSecret } = await req.json();

  if (adminSecret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!subject || !body || !audience) {
    return NextResponse.json({ error: "subject, body, and audience required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "Resend not configured" }, { status: 500 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  // Fetch target users
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const allUsers = usersData?.users ?? [];

  // Fetch profiles for plan + sector
  const { data: profiles } = await admin.from("profiles").select("id, plan, sector");
  const profileMap = new Map(
    ((profiles ?? []) as { id: string; plan: string; sector: string | null }[]).map((p) => [p.id, p])
  );

  // Filter by audience
  const targetUsers = allUsers.filter((u) => {
    if (!u.email) return false;
    const plan = profileMap.get(u.id)?.plan ?? "free";
    if (audience === "all") return true;
    return plan === audience;
  });

  if (targetUsers.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  // Build per-user emails
  const emails = targetUsers.map((u) => {
    const sector = profileMap.get(u.id)?.sector ?? null;
    const agent = getAgent(sector);
    const html = buildHtml(body, agent.name, agent.sectorLabel);
    return {
      from: `${agent.name} — Genessa ${agent.sectorLabel} Intelligence <hello@genessa.ai>`,
      to: [u.email!],
      subject,
      html,
    };
  });

  // Send in batches of 100 (Resend batch limit)
  let sent = 0;
  const chunks: typeof emails[] = [];
  for (let i = 0; i < emails.length; i += 100) chunks.push(emails.slice(i, i + 100));

  for (const chunk of chunks) {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });
    if (res.ok) sent += chunk.length;
  }

  // Log to email_sends
  await admin.from("email_sends").insert({
    subject,
    audience,
    recipient_count: sent,
    sent_by: "admin",
  });

  return NextResponse.json({ success: true, sent });
}
