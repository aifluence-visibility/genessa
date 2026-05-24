import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || "info@genessa.io";

    if (!apiKey || apiKey === "yeni_key_buraya") {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json({ error: "Mail service not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Genessa <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `Contact: ${name} (${email})`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", body);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
