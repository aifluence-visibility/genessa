import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

const SECTOR_AGENTS: Record<string, { name: string; sectorLabel: string; color: string }> = {
  restaurant: { name: "Savor",  sectorLabel: "Restaurant",  color: "#F97316" },
  hotel:      { name: "Haven",  sectorLabel: "Hospitality", color: "#F59E0B" },
  clinic:     { name: "Vita",   sectorLabel: "Medical",     color: "#06B6D4" },
  ecommerce:  { name: "Flux",   sectorLabel: "Commerce",    color: "#10B981" },
  saas:       { name: "Nexus",  sectorLabel: "SaaS",        color: "#8B5CF6" },
  legal:      { name: "Vero",   sectorLabel: "Legal",       color: "#1D4ED8" },
  creator:    { name: "Lumen",  sectorLabel: "Creator",     color: "#EC4899" },
};

function buildHtml(body: string, agentName: string, sectorLabel: string, accentColor: string): string {
  const htmlBody = body.replace(/\n/g, "<br>");
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#ffffff">
  <div style="padding:16px 0 24px;border-bottom:2px solid ${accentColor}">
    <strong style="font-size:16px;color:#111827">${agentName}</strong>
    <span style="color:#6B7280;font-size:13px"> — Genessa ${sectorLabel} Intelligence</span>
  </div>
  <div style="padding:24px 0;color:#374151;line-height:1.7;font-size:15px">
    ${htmlBody}
  </div>
  <div style="padding-top:24px;border-top:1px solid #E5E7EB">
    <p style="color:#9CA3AF;font-size:12px;margin:0">
      The ${agentName} Team | Powered by Genessa<br>
      <a href="https://genessa.ai" style="color:#9CA3AF">genessa.ai</a>
    </p>
  </div>
</div>`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { agencyEmail, clientDomain, sector, subject, body: emailBody, adminSecret } = body;

  if (adminSecret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!agencyEmail || !subject || !emailBody) {
    return NextResponse.json({ error: "agencyEmail, subject, and body required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "Resend API not configured" }, { status: 500 });

  const agent = SECTOR_AGENTS[sector] ?? { name: "Genessa", sectorLabel: "AI Visibility", color: "#6B7280" };
  const html = buildHtml(emailBody, agent.name, agent.sectorLabel, agent.color);

  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${agent.name} — Genessa <hello@genessa.io>`,
      to: [agencyEmail],
      subject,
      html,
    }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  if (admin) {
    await admin.from("email_sends").insert({
      subject,
      audience: "agency_client",
      recipient_count: 1,
      sent_by: clientDomain ?? agencyEmail,
    });
  }

  return NextResponse.json({ success: true, sent: 1 });
}
