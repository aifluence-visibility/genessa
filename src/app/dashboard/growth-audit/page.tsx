"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePlan, type Plan } from "@/lib/plan";
import PlanGate from "@/components/dashboard/PlanGate";

export default function GrowthAuditPage() {
  const [plan, setPlan] = useState<Plan>("free");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setPlan(normalizePlan(profile?.plan as string));
          setReady(true);
        });
    });
  }, []);

  if (!ready) return null;

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          🚀 Growth Audit
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Multi-agent AI analysis — technical, content, and authority.
        </p>
      </div>
      <PlanGate
        requiredPlan="pro"
        currentPlan={plan}
        featureName="Growth Audit"
        featureDescription="Run a full multi-agent growth audit across technical, content, and authority dimensions. Get a prioritised action plan. Available on Pro and above."
      >
        <div style={{
          padding: "48px 32px", borderRadius: 16,
          background: "#111827", border: "1px solid #1F2937",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F9FAFB", margin: "0 0 8px" }}>
            Growth Audit — coming soon in this panel
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", maxWidth: 400, margin: "0 auto" }}>
            The full Growth Audit experience is being moved here. In the meantime, go to your Dashboard Overview to run an audit.
          </p>
        </div>
      </PlanGate>
    </div>
  );
}
