"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePlan, type Plan } from "@/lib/plan";
import PlanGate from "@/components/dashboard/PlanGate";

export default function AuthorityPage() {
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
          🏆 AI Authority
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          E-E-A-T signals and semantic authority analysis.
        </p>
      </div>
      <PlanGate
        requiredPlan="starter"
        currentPlan={plan}
        featureName="AI Authority"
        featureDescription="Unlock authority scoring, E-E-A-T signal analysis, and trust indicators. Available on Starter and above."
      >
        <div style={{
          padding: "48px 32px", borderRadius: 16,
          background: "#fff", border: "1px solid #E5E7EB",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🏆</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
            AI Authority detail — coming soon
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", maxWidth: 360, margin: "0 auto" }}>
            Detailed authority score breakdown and improvement recommendations.
          </p>
        </div>
      </PlanGate>
    </div>
  );
}
