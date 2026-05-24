# GENESSA — DASHBOARD SYSTEM

## Amaç
Dashboard = "AI visibility control center"
NOT: "bir kere scan aracı"
YES: "sürekli takip ve optimizasyon merkezi"

Kullanıcı her hafta açıp bakmalı.
Retention = trend graph + action checklist + score değişimi.

---

## Dashboard Ana Bileşenleri

### 1. Score Overview Panel
```
┌─────────────────────────────────────────────────────┐
│  nurdai.com                          [+ Add domain] │
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ Readiness │  │ Authority │  │ Influence │       │
│  │  68 →75   │  │  52 →58   │  │  41       │       │
│  │  ↑ +7     │  │  ↑ +6     │  │  —        │       │
│  └───────────┘  └───────────┘  └───────────┘       │
│                                                     │
│  Last scan: 3 days ago    [Rescan now]              │
└─────────────────────────────────────────────────────┘
```

Score yanında delta göster: önceki scan'e göre +/- kaç puan.
Delta yeşil = iyileşme, kırmızı = gerileme.

---

### 2. Trend Graph
- X ekseni: tarih (son 90 gün)
- Y ekseni: 3 skor çizgisi (Readiness / Authority / Influence)
- Tooltip: "Schema added → +15" gibi event marker

**Minimum 3 scan olmadan graph gösterme.** Bunun yerine:
"Track your progress — rescan after making improvements to see your trend."

---

### 3. Action Checklist
Eksik checklerden otomatik oluşur. Kullanıcı tamamlandı işaretleyebilir.

```
AI Visibility Checklist
━━━━━━━━━━━━━━━━━━━━━━━
☐ Add Organization JSON-LD schema         +15 pts   [How to →]
☐ Add answer-first content to homepage    +15 pts   [How to →]
☐ Add article:published_time meta          +5 pts   [How to →]
☑ llms.txt is in place                   ✓ Done
☑ Robots.txt allows AI bots              ✓ Done
```

"How to →" linki: her check için kısa implementasyon rehberi (static page).
Manuel tamamlama: kullanıcı işaret edince "verify" tetiklenir → o check'i re-run eder.

---

### 4. Technical Issue Tracking
```
Status: 3 critical  2 resolved  4 passing

Critical:
● Schema.org missing          Since: first scan
● Answer-first content low    Since: first scan
● Entity links missing        Since: first scan

Resolved:
✓ llms.txt added              Fixed: 12 May
✓ OG tags completed           Fixed: 10 May
```

---

### 5. Page-Level Analysis (Premium)
Ana sayfa + en fazla 5 iç sayfa.

```
Page         Readiness   Answer-First   Schema
/             68%         ✗ Missing      ✗
/hizmetler    72%         ✗ Missing      ✗
/hakkimda     81%         ✓ Pass         ✗
/blog/post-1  75%         ~ Partial      ✓
```

Hangi sayfaların öncelikli düzeltilmesi gerektiği: impact score'a göre sırala.

---

### 6. AI Insight Panel (sağ kolon)
Her dashboardda güncel insight blokları göster.
Rescan yapılmadıkça cache'den gelir.

```
AI Intelligence
━━━━━━━━━━━━━━━━
✓ Strongest point
  [text]

✗ Critical gap
  [text]

💡 Quick win
  [text]

⚡ Opportunity
  [text]
```

---

### 7. AI Mention Tracking Panel (Premium, Influence Score altında)
```
AI Mention Status
━━━━━━━━━━━━━━━━━
Last checked: 2 days ago

ChatGPT        ○ Not mentioned
Perplexity     ○ Not mentioned
Claude         ○ Not mentioned
Google AIO     ~ Partially

Queries asked: 3
"best AI visibility consultant Turkey"
"AI SEO strategy for brands"
"GEO optimization service"

[View full mention report →]
```

**Gösterim notu:** "Not mentioned" = kötü haber değil, nötr göster.
Mesaj: "Building AI presence takes time. Here's what to improve:"

---

### 8. Semantic Gap Analysis (Premium)
```
Semantic Coverage
━━━━━━━━━━━━━━━━━

Strong coverage:
✓ AI visibility
✓ GEO optimization
✓ ChatGPT marketing

Weak coverage:
○ Brand authority building
○ Perplexity optimization
○ AI content strategy

Opportunity topics:
+ Voice search AI optimization
+ Multimodal content AI
```

Bu analiz LLM'den gelir, haftada 1 güncellenir.

---

## Dashboard Bileşen Listesi (React components)

```
/components/genessa/dashboard/
  DashboardHeader.tsx        — domain seçici + rescan button
  ScoreOverview.tsx          — 3 skor kartı + delta
  TrendGraph.tsx             — Chart.js line graph
  ActionChecklist.tsx        — checklist + verify trigger
  IssueTracker.tsx           — critical/resolved/passing
  PageLevelTable.tsx         — sayfa bazlı analiz tablosu
  InsightPanel.tsx           — 6 insight bloğu
  MentionTracker.tsx         — AI mention status
  SemanticGapPanel.tsx       — coverage analysis
```

---

## State Yönetimi

```typescript
interface DashboardState {
  selectedDomain: string
  scans: ScanRecord[]           // tarihsel tüm scanler
  latestScan: ScanRecord
  previousScan: ScanRecord | null
  insights: InsightRecord       // LLM output, cached
  mentions: MentionRecord[]     // async job results
  checklistItems: ChecklistItem[] // kullanıcı tamamlama durumu
}
```

---

## Retention Mekanizmaları

1. **Email notifikasyon:** "Your AI visibility score dropped 8 points — see what changed."
2. **Haftalık digest:** Puan değişimi + yeni mention sonuçları.
3. **Checklist gamification:** "You've completed 4/7 items — you're 73% optimized."
4. **Competitor alert (faz 3):** "A competitor improved their score by 12 points this week."
