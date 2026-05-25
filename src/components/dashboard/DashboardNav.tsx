"use client";

import Link from "next/link";
import { getPlanColor, getPlanLabel, type Plan } from "@/lib/plan";

type NavItemDef = {
  href: string;
  label: string;
  icon: string;
  plans: Plan[];
  lockLabel?: string;
  highlight?: boolean;
  upgradeAction?: boolean;
};

const NAV_ITEMS: NavItemDef[] = [
  { href: "/dashboard",             label: "Overview",      icon: "📊", plans: ["free","starter","pro","agency","consulting"] },
  { href: "/dashboard/readiness",   label: "AI Readiness",  icon: "🔍", plans: ["free","starter","pro","agency","consulting"] },
  { href: "/dashboard/authority",   label: "AI Authority",  icon: "🏆", plans: ["starter","pro","agency","consulting"], lockLabel: "Starter+" },
  { href: "/dashboard/influence",   label: "AI Influence",  icon: "📣", plans: ["pro","agency","consulting"], lockLabel: "Pro+" },
  { href: "/dashboard/growth-audit",label: "Growth Audit",  icon: "🚀", plans: ["pro","agency","consulting"], lockLabel: "Pro+" },
  { href: "/dashboard/scan-history",label: "Scan History",  icon: "📋", plans: ["starter","pro","agency","consulting"], lockLabel: "Starter+" },
  { href: "/dashboard/reports",     label: "Reports",       icon: "📄", plans: ["pro","agency","consulting"], lockLabel: "Pro+" },
  { href: "/dashboard/badge",       label: "My Badge",      icon: "🏅", plans: ["free","starter","pro","agency","consulting"] },
  { href: "/dashboard/settings",    label: "Settings",      icon: "⚙️", plans: ["free","starter","pro","agency","consulting"] },
  { href: "/dashboard/upgrade",     label: "Upgrade",       icon: "⬆️", plans: ["free","starter","pro"], highlight: true, upgradeAction: true },
];

type Props = {
  plan: Plan;
  pathname: string;
  email?: string | null;
  onSignOut?: () => void;
  onUpgrade?: () => void;
};

export default function DashboardNav({ plan, pathname, email, onSignOut, onUpgrade }: Props) {
  const planColor = getPlanColor(plan);
  const planLabel = getPlanLabel(plan);

  return (
    <div style={{
      width: 220,
      height: "100vh",
      background: "#0F172A",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid #1E293B",
      position: "sticky",
      top: 0,
    }}>
      {/* Logo + plan badge */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1E293B" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          }}>
            Genessa
          </span>
        </Link>
        <div style={{ marginTop: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "2px 8px", borderRadius: 20,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
            background: planColor + "22", color: planColor,
            border: `1px solid ${planColor}44`,
          }}>
            {planLabel}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const hasAccess = (item.plans as string[]).includes(plan);
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          if (!hasAccess) {
            return (
              <button
                key={item.href}
                onClick={onUpgrade}
                style={{
                  width: "100%", background: "none", border: "none",
                  padding: 0, cursor: "pointer", textAlign: "left" as const,
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", borderRadius: 8, marginBottom: 1,
                  opacity: 0.45,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>{item.label}</span>
                  </div>
                  {item.lockLabel && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
                      background: "rgba(245,158,11,0.15)", color: "#F59E0B",
                      border: "1px solid rgba(245,158,11,0.3)",
                    }}>
                      {item.lockLabel}
                    </span>
                  )}
                </div>
              </button>
            );
          }

          if (item.upgradeAction && onUpgrade) {
            return (
              <button
                key={item.href}
                onClick={onUpgrade}
                style={{
                  width: "100%", background: "none", border: "none",
                  padding: 0, cursor: "pointer", textAlign: "left" as const,
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderRadius: 8, marginBottom: 1,
                  border: `1px solid ${planColor}44`,
                }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 400, color: planColor }}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "8px 10px", borderRadius: 8, marginBottom: 1,
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                cursor: "pointer",
                border: item.highlight ? `1px solid ${planColor}44` : "1px solid transparent",
              }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#F1F5F9" : item.highlight ? planColor : "#94A3B8",
                }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div style={{ padding: "12px 16px 20px", borderTop: "1px solid #1E293B" }}>
        {email && (
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10, wordBreak: "break-all", lineHeight: 1.4 }}>
            {email}
          </div>
        )}
        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              width: "100%", fontSize: 12, fontWeight: 500, color: "#64748B",
              background: "none", border: "1px solid #1E293B",
              borderRadius: 7, padding: "7px 12px", cursor: "pointer",
              fontFamily: "var(--font-geist-sans)", textAlign: "center",
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
