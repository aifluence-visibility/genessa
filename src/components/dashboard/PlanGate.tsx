"use client";

import Link from "next/link";
import type { Plan } from "@/lib/plan";

type Props = {
  requiredPlan: "starter" | "pro";
  currentPlan: Plan;
  featureName: string;
  featureDescription: string;
  children: React.ReactNode;
};

const PLAN_ORDER: Record<Plan, number> = {
  free:       0,
  starter:    1,
  pro:        2,
  agency:     3,
  consulting: 4,
};

export default function PlanGate({ requiredPlan, currentPlan, featureName, featureDescription, children }: Props) {
  const required = PLAN_ORDER[requiredPlan];
  const current  = PLAN_ORDER[currentPlan];

  if (current >= required) {
    return <>{children}</>;
  }

  const waLink = `https://wa.me/90525788737?text=${encodeURIComponent(
    `Hi! I'm interested in upgrading to ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} to access ${featureName}.`
  )}`;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", padding: "48px 32px", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24, fontSize: 28,
      }}>
        🔒
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
        {featureName}
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 380, margin: "0 0 32px" }}>
        {featureDescription}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/dashboard/upgrade"
          style={{
            padding: "10px 22px", borderRadius: 10,
            background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
            color: "#fff", fontSize: 13, fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Unlock with {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} →
        </Link>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 22px", borderRadius: 10,
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            color: "#16A34A", fontSize: 13, fontWeight: 600,
            textDecoration: "none",
          }}
        >
          💬 Contact on WhatsApp
        </a>
      </div>
    </div>
  );
}
