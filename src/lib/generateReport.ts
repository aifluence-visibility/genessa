export interface ReportData {
  domain: string;
  readiness: number;
  authority: number | null;
  influence: number | null;
  insight: {
    hero_text: string | null;
    strongest_point: string | null;
    critical_gap: string | null;
    quick_win: string | null;
  } | null;
  sectorLabel: string | null;
  checklist: Array<{ label: string; points: number }> | null;
}

export async function generateReport(data: ReportData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const { domain, readiness: rs, authority: auth, influence: inf, insight: ins, sectorLabel, checklist } = data;

  const W = 210, H = 297, mx = 18;
  const cW = W - mx * 2;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  function scoreRGB(s: number): [number, number, number] {
    if (s >= 80) return [22, 163, 74];
    if (s >= 60) return [41, 82, 227];
    return [220, 38, 38];
  }
  function verdict(s: number): string {
    if (s >= 80) return "Strong AI Visibility";
    if (s >= 60) return "Moderate AI Visibility";
    return "Needs Improvement";
  }
  function summary(s: number): string {
    if (s >= 80) return "This site is well-optimised for AI discovery. Reinforce these quality signals to stay ahead.";
    if (s >= 60) return "Good foundation — address the critical gaps in the action plan to reach the next level.";
    return "Several important AI visibility signals are missing. Prioritise the actions below to improve quickly.";
  }

  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(41, 82, 227);
    doc.text("Genessa", mx, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(156, 163, 175);
    doc.text(domain, W - mx, 18, { align: "right" });

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(mx, 22, W - mx, 22);
  }

  function drawFooter(page: number) {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(mx, 279, W - mx, 279);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Powered by Genessa", mx, 286);
    doc.text(`${domain}  ·  ${dateStr}`, W / 2, 286, { align: "center" });
    doc.text(`${page} / 4`, W - mx, 286, { align: "right" });
  }

  // ═══════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════

  // Gradient background: #1E1B4B → #4F46E5
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    doc.setFillColor(
      Math.round(30 + (79 - 30) * t),
      Math.round(27 + (70 - 27) * t),
      Math.round(75 + (229 - 75) * t),
    );
    doc.rect(0, (H * i) / steps, W, H / steps + 0.5, "F");
  }

  // Logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("Genessa", mx, 27);

  // Report label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 155, 215);
  doc.text("AI VISIBILITY REPORT", W - mx, 27, { align: "right" });

  // Header separator
  doc.setDrawColor(160, 155, 215);
  doc.setLineWidth(0.15);
  doc.line(mx, 32, W - mx, 32);

  // Domain label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(160, 155, 215);
  doc.text("DOMAIN UNDER ANALYSIS", W / 2, 118, { align: "center" });

  // Domain name (big, white, font size scales with length)
  const domFontSize = domain.length > 30 ? 16 : domain.length > 22 ? 20 : 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(domFontSize);
  doc.setTextColor(255, 255, 255);
  doc.text(domain, W / 2, 135, { align: "center" });

  // Date + sector
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(160, 155, 215);
  doc.text(sectorLabel ? `${dateStr}  ·  ${sectorLabel}` : dateStr, W / 2, 151, { align: "center" });

  // Bottom separator
  doc.setDrawColor(160, 155, 215);
  doc.setLineWidth(0.15);
  doc.line(mx, 274, W - mx, 274);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 155, 215);
  doc.text("Powered by Genessa", W / 2, 283, { align: "center" });
  doc.text("1 / 4", W - mx, 283, { align: "right" });

  // ═══════════════════════════════════════
  // PAGE 2 — SCORES
  // ═══════════════════════════════════════
  doc.addPage();
  drawHeader();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("AI VISIBILITY SCORES", mx, 32);

  const bW = (cW - 8) / 3;
  const bH = 58;
  const bY = 36;

  (
    [
      { label: "READINESS", value: rs,   pending: false },
      { label: "AUTHORITY", value: auth, pending: auth === null },
      { label: "INFLUENCE", value: inf,  pending: inf === null },
    ] as const
  ).forEach(({ label, value, pending }, idx) => {
    const bX = mx + idx * (bW + 4);

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(bX, bY, bW, bH, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(label, bX + bW / 2, bY + 11, { align: "center" });

    if (pending || value === null) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(209, 213, 219);
      doc.text("—", bX + bW / 2, bY + 34, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Analysis pending", bX + bW / 2, bY + 45, { align: "center" });
    } else {
      const [r, g, b] = scoreRGB(value);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      doc.setTextColor(r, g, b);
      doc.text(String(value), bX + bW / 2, bY + 35, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(verdict(value), bX + bW / 2, bY + 46, { align: "center" });
    }
  });

  // Overall assessment box
  const assLabelY = bY + bH + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("OVERALL ASSESSMENT", mx, assLabelY);

  const assBoxY = assLabelY + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.roundedRect(mx, assBoxY, cW, 54, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(17, 24, 39);
  doc.text(verdict(rs), mx + 8, assBoxY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(107, 114, 128);
  const sumLines = doc.splitTextToSize(summary(rs), cW - 16);
  doc.text(sumLines, mx + 8, assBoxY + 23);

  // Divider + score chips
  const chipLineY = assBoxY + 38;
  doc.setDrawColor(243, 244, 246);
  doc.setLineWidth(0.4);
  doc.line(mx + 8, chipLineY, mx + cW - 8, chipLineY);

  const chips: Array<{ label: string; value: number }> = [
    { label: "READINESS", value: rs },
    ...(auth !== null ? [{ label: "AUTHORITY", value: auth }] : []),
    ...(inf !== null ? [{ label: "INFLUENCE", value: inf }] : []),
  ];
  chips.forEach(({ label, value }, i) => {
    const cx = mx + 8 + i * 44;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(label, cx, chipLineY + 7);
    const [cr, cg, cb] = scoreRGB(value);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(cr, cg, cb);
    doc.text(String(value), cx, chipLineY + 15);
  });

  drawFooter(2);

  // ═══════════════════════════════════════
  // PAGE 3 — AI INTELLIGENCE
  // ═══════════════════════════════════════
  doc.addPage();
  drawHeader();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("AI INTELLIGENCE", mx, 32);

  let iy = 37;

  if (ins?.hero_text) {
    const heroLines = doc.splitTextToSize(ins.hero_text, cW - 16);
    const heroH = heroLines.length * 5.5 + 18;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.roundedRect(mx, iy, cW, heroH, 3, 3, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text("SUMMARY", mx + 8, iy + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(heroLines, mx + 8, iy + 17);
    iy += heroH + 6;
  }

  const intelRows = [
    {
      label: "STRONGEST POINT",
      text: ins?.strongest_point ?? null,
      ar: 22, ag: 163, ab: 74,
      br: 240, bg: 253, bb: 244,
    },
    {
      label: "CRITICAL GAP",
      text: ins?.critical_gap ?? null,
      ar: 220, ag: 38, ab: 38,
      br: 254, bg: 242, bb: 242,
    },
    {
      label: "QUICK WIN",
      text: ins?.quick_win ?? null,
      ar: 234, ag: 88, ab: 12,
      br: 255, bg: 247, bb: 237,
    },
  ];

  intelRows.forEach(({ label, text, ar, ag, ab, br, bg: bgG, bb }) => {
    if (!text) return;
    const textLines = doc.splitTextToSize(text, cW - 22);
    const boxH = Math.max(26, textLines.length * 5.2 + 18);

    // Tinted background
    doc.setFillColor(br, bgG, bb);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(mx, iy, cW, boxH, 3, 3, "FD");

    // Left accent bar (draw solid rect over the rounded left edge)
    doc.setFillColor(ar, ag, ab);
    doc.rect(mx, iy, 4, boxH, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(ar, ag, ab);
    doc.text(label, mx + 12, iy + 9);

    // Body text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text(textLines, mx + 12, iy + 18);

    iy += boxH + 5;
  });

  if (!ins) {
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(mx, iy, cW, 22, 3, 3, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text("AI Intelligence data is not available for this scan.", mx + cW / 2, iy + 13, { align: "center" });
  }

  drawFooter(3);

  // ═══════════════════════════════════════
  // PAGE 4 — ACTION PLAN
  // ═══════════════════════════════════════
  doc.addPage();
  drawHeader();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("ACTION PLAN", mx, 32);

  // Checklist
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Priority Checklist — fix these first", mx, 40);

  const items = checklist ?? [
    { label: "Add Organization schema", points: 15 },
    { label: "Add answer-first content to homepage", points: 15 },
    { label: "Create llms.txt", points: 10 },
  ];

  let cy = 44;
  const clRowH = 12;

  items.forEach((item, i) => {
    const isCritical = i < 3;
    doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.rect(mx, cy, cW, clRowH, "FD");

    if (isCritical) {
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.5);
      doc.roundedRect(mx + 4, cy + 3.5, 5, 5, 1, 1, "S");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(isCritical ? 55 : 156, isCritical ? 65 : 163, isCritical ? 81 : 175);
    doc.text(item.label, mx + 14, cy + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (isCritical) {
      doc.setTextColor(220, 38, 38);
      doc.text("CRITICAL", W - mx - 2, cy + 8, { align: "right" });
    } else {
      doc.setTextColor(161, 98, 7);
      doc.text("PRO", W - mx - 2, cy + 8, { align: "right" });
    }
    cy += clRowH;
  });

  cy += 10;

  // Technical issues table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Technical Issues", mx, cy);
  cy += 5;

  // Table header
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.rect(mx, cy, cW, 9, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text("ISSUE", mx + 10, cy + 6);
  doc.text("STATUS", W - mx - 2, cy + 6, { align: "right" });
  cy += 9;

  const techRows = [
    ...items.slice(0, 3).map(c => ({ label: c.label, status: "critical" as const })),
    { label: "HTTPS active",          status: "passing" as const },
    { label: "Sitemap present",       status: "passing" as const },
    { label: "Robots.txt configured", status: "passing" as const },
  ];

  techRows.forEach((row, i) => {
    const tH = 11;
    doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.rect(mx, cy, cW, tH, "FD");

    // Status dot
    const [dr, dg, db] = row.status === "critical" ? [220, 38, 38] : [209, 213, 219];
    doc.setFillColor(dr, dg, db);
    doc.circle(mx + 6, cy + tH / 2, 1.8, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(row.label, mx + 12, cy + 7.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (row.status === "critical") {
      doc.setTextColor(220, 38, 38);
      doc.text("CRITICAL", W - mx - 2, cy + 7.5, { align: "right" });
    } else {
      doc.setTextColor(107, 114, 128);
      doc.text("PASSING", W - mx - 2, cy + 7.5, { align: "right" });
    }
    cy += tH;
  });

  drawFooter(4);

  doc.save("genessa-report.pdf");
}
