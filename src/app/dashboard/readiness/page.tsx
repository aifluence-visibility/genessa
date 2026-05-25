"use client";

export default function ReadinessPage() {
  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          🔍 AI Readiness
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Detailed breakdown of your technical AI readiness signals.
        </p>
      </div>
      <div style={{
        padding: "48px 32px", borderRadius: 16,
        background: "#fff", border: "1px solid #E5E7EB",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          Coming soon
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", maxWidth: 360, margin: "0 auto" }}>
          Detailed readiness check breakdown with per-signal fix recommendations.
        </p>
      </div>
    </div>
  );
}
