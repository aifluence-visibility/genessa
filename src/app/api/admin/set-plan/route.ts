import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

const PLAN_EMAILS: Record<string, { subject: string; features: string[] }> = {
  starter: {
    subject: "Welcome to Genessa Starter 🚀",
    features: [
      "2 scans per week",
      "All 6 AI insight blocks",
      "Full action checklist",
      "Scan history",
    ],
  },
  pro: {
    subject: "Welcome to Genessa Pro ⚡",
    features: [
      "Unlimited scans",
      "Growth Audit (multi-agent AI)",
      "PDF report export",
      "Up to 3 domains",
      "AI Influence Score (full)",
    ],
  },
  agency: {
    subject: "Welcome to Genessa Enterprise 🏢",
    features: [
      "Up to 10 business entities",
      "All Pro features per entity",
      "Unified management dashboard",
      "White-label option",
      "Dedicated support",
    ],
  },
  consulting: {
    subject: "Welcome to Genessa Consulting 🎯",
    features: [
      "Full AI Visibility OS access",
      "Custom roadmap generation",
      "Weekly consulting dashboard",
      "Branded PDF reports",
      "Priority support",
    ],
  },
};

function buildEmailHtml(plan: string): string {
  const meta = PLAN_EMAILS[plan];
  if (!meta) return "";
  const featureItems = meta.features
    .map((f) => `<li style="margin-bottom:8px">${f}</li>`)
    .join("");
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 24px">
  <div style="margin-bottom:24px">
    <strong style="font-size:20px">${meta.subject}</strong>
  </div>
  <p style="color:#374151;font-size:15px;line-height:1.7">
    Your account has been activated. Here's what you can do now:
  </p>
  <ul style="margin:20px 0;padding-left:20px">
    ${featureItems}
  </ul>
  <a href="https://citely-rho.vercel.app/dashboard"
    style="display:inline-block;padding:12px 24px;background:#2952E3;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
    Go to Dashboard →
  </a>
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #E5E7EB">
    <p style="color:#9CA3AF;font-size:12px;margin:0">The Genessa Team | genessa.ai</p>
  </div>
</div>`;
}

export async function POST(req: Request) {
  const body = await req.json() as { secret?: string; userId?: string; plan?: string };
  const { secret, userId, plan } = body;

  if (!secret || secret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId || !["free", "starter", "pro", "agency", "consulting"].includes(plan ?? "")) {
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

  // Send welcome email — best-effort, plan is already activated
  if (plan && plan !== "free" && PLAN_EMAILS[plan] && process.env.RESEND_API_KEY) {
    try {
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      const userEmail = userData.user?.email;
      if (userEmail) {
        const meta = PLAN_EMAILS[plan];
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Genessa <onboarding@resend.dev>",
            to: userEmail,
            subject: meta.subject,
            html: buildEmailHtml(plan),
          }),
        });
      }
    } catch {
      // email failed — continue
    }
  }

  return NextResponse.json({ success: true });
}
