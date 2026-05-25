"use client";

import { useState } from "react";
import type { Plan } from "@/lib/plan";

type Props = {
  requiredPlan: "starter" | "pro";
  currentPlan: Plan;
  featureName: string;
  featureDescription: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
};

const PLAN_ORDER: Record<Plan, number> = {
  free:       0,
  starter:    1,
  pro:        2,
  agency:     3,
  consulting: 4,
};

function UpgradeModal({ onClose, requiredPlan, featureName }: { onClose: () => void; requiredPlan: "starter" | "pro"; featureName: string }) {
  const waLink = `https://wa.me/90525788737?text=${encodeURIComponent(
    `Hi! I'm interested in upgrading to ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} to access ${featureName} on Genessa.`
  )}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111827", border: "1px solid #1F2937",
          borderRadius: 16, padding: 32, maxWidth: 420, width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F9FAFB", margin: "0 0 8px" }}>
            Upgrade to unlock
          </h2>
          <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: "#E5E7EB" }}>{featureName}</strong> is available on{" "}
            {requiredPlan === "starter" ? "Starter and Pro" : "Pro"} plans.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#1F2937", border: "1px solid #3B82F6", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Starter</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#F9FAFB" }}>$29</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>/month</div>
            <div style={{ fontSize: 12, color: "#D1D5DB", textAlign: "left" as const }}>
              ✓ Full insights<br/>
              ✓ Full checklist<br/>
              ✓ Scan history<br/>
              ✓ 2 scans/week
            </div>
          </div>
          <div style={{ background: "#1F2937", border: "1px solid #8B5CF6", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#8B5CF6", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Pro</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#F9FAFB" }}>$79</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>/month</div>
            <div style={{ fontSize: 12, color: "#D1D5DB", textAlign: "left" as const }}>
              ✓ Growth Audit<br/>
              ✓ PDF Export<br/>
              ✓ 1 domain<br/>
              ✓ 4 scans/week
            </div>
          </div>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", width: "100%", padding: "12px 0", borderRadius: 8,
            background: "#25D366", color: "#fff", fontWeight: 600, fontSize: 14,
            textAlign: "center", textDecoration: "none", marginBottom: 8,
            boxSizing: "border-box" as const,
          }}
        >
          💬 Contact us on WhatsApp
        </a>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8,
            background: "transparent", color: "#6B7280", fontWeight: 500, fontSize: 14,
            border: "1px solid #374151", cursor: "pointer",
            fontFamily: "var(--font-geist-sans)",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

export default function PlanGate({ requiredPlan, currentPlan, featureName, featureDescription, children, onUpgrade }: Props) {
  const [showModal, setShowModal] = useState(false);
  const required = PLAN_ORDER[requiredPlan];
  const current  = PLAN_ORDER[currentPlan];

  if (current >= required) {
    return <>{children}</>;
  }

  function handleUpgradeClick() {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowModal(true);
    }
  }

  const waLink = `https://wa.me/90525788737?text=${encodeURIComponent(
    `Hi! I'm interested in upgrading to ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} to access ${featureName}.`
  )}`;

  return (
    <>
      {showModal && (
        <UpgradeModal
          onClose={() => setShowModal(false)}
          requiredPlan={requiredPlan}
          featureName={featureName}
        />
      )}
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" }}>
          <button
            onClick={handleUpgradeClick}
            style={{
              padding: "10px 22px", borderRadius: 10,
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              border: "none", cursor: "pointer",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            Unlock with {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} →
          </button>
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
    </>
  );
}
