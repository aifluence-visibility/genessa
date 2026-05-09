import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const rows = [
  { site: "stripe.com", cat: "Payments", score: 95, featured: true, status: "verified" },
  { site: "linear.app", cat: "Productivity", score: 91, featured: true, status: "verified" },
  { site: "vercel.com", cat: "Infrastructure", score: 87, featured: false, status: "verified" },
  { site: "acme.com", cat: "SaaS", score: 82, featured: false, status: "verified" },
  { site: "smallsite.io", cat: "Blog", score: 44, featured: false, status: "progress" },
];

function barColor(s: number) {
  return s >= 80 ? "var(--genessa-gradient)" : s >= 60 ? "#F59E0B" : "#EF4444";
}

export default function Directory() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-[1080px] mx-auto px-4 md:px-8 overflow-hidden" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="relative text-center overflow-hidden" style={{ marginBottom: 40 }}>
          <div className="absolute pointer-events-none" style={{ inset: 0, background: "radial-gradient(50% 50% at 50% 30%, rgba(75,123,255,0.12) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Verified directory</div>
            <h1 className="text-3xl md:text-[56px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 14px" }}>
              Sites AI <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>trusts</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", maxWidth: 560, margin: "0 auto" }}>Score 80+ and you&apos;re auto-listed. AI agents query this directory as a vetted source. 90+ scores get top placement.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ marginBottom: 14 }}>
          <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 14, color: "var(--fg-2)" }}>
            <span className="eyebrow">Showing</span>
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>5 of 247</span>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: "var(--border-strong)" }} />
            <span className="inline-flex items-center gap-1.5" style={{ padding: "3px 10px", borderRadius: 99, background: "var(--score-good-bg)", color: "#10B981", fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500, marginLeft: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />2 featured
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {["All", "SaaS", "Infrastructure", "Productivity", "Payments"].map((c, i) => (
              <button key={c} style={{
                fontFamily: "var(--font-geist-sans)", fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
                border: i === 0 ? "1px solid var(--genessa-blue)" : "1px solid var(--border)",
                background: i === 0 ? "rgba(41,82,227,0.06)" : "var(--bg)",
                color: i === 0 ? "var(--genessa-blue)" : "var(--fg-2)", cursor: "pointer", whiteSpace: "nowrap",
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-[14px] border border-[var(--border)] bg-[var(--bg)]" style={{ boxShadow: "var(--shadow-sm)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)" }}>
                <th style={th}>Site</th>
                <th style={th}>Category</th>
                <th style={th}>Score</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.site} style={{ borderTop: "1px solid var(--border)", ...(r.featured ? { background: "linear-gradient(90deg,rgba(75,123,255,0.04),rgba(123,63,228,0.02))" } : {}) }}>
                  <td style={td}>
                    <div className="flex items-center gap-3" style={{ fontWeight: 500 }}>
                      <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bg-muted)", fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--fg-2)", fontWeight: 600 }}>
                        {r.site[0].toUpperCase()}
                      </div>
                      <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 14 }}>{r.site}</span>
                      {r.featured && <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", background: "var(--genessa-gradient)", color: "#fff", marginLeft: 8 }}>Featured</span>}
                    </div>
                  </td>
                  <td style={{ ...td, color: "var(--fg-2)" }}>{r.cat}</td>
                  <td style={td}>
                    <div className="flex items-center gap-2.5" style={{ width: 180 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--bg-muted)", overflow: "hidden" }}>
                        <div style={{ width: `${r.score}%`, height: "100%", borderRadius: 99, background: barColor(r.score) }} />
                      </div>
                      <span style={{
                        fontFamily: "var(--font-geist-mono)", fontWeight: 600, fontSize: 14, width: 32,
                        ...(r.score >= 80
                          ? { background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
                          : { color: r.score >= 60 ? "#F59E0B" : "#EF4444" })
                      }}>{r.score}</span>
                    </div>
                  </td>
                  <td style={td}>
                    {r.status === "verified"
                      ? <span className="inline-flex items-center gap-1.5" style={{ padding: "3px 10px", borderRadius: 99, background: "var(--score-good-bg)", color: "#10B981", fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />Verified</span>
                      : <span className="inline-flex items-center gap-1.5" style={{ padding: "3px 10px", borderRadius: 99, background: "var(--score-mid-bg)", color: "#B45309", fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />In progress</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "14px 20px", fontSize: 11, fontFamily: "var(--font-geist-mono)", fontWeight: 500, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "18px 20px", verticalAlign: "middle" };
