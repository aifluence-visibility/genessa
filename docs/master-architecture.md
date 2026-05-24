# GENESSA — MASTER ARCHITECTURE

## Positioning
> "AI systems understand, trust and recommend your brand."

Genessa = AI Visibility Intelligence Platform
NOT: technical checker
YES: data engine + AI strategist layer

---

## Stack (current / target)
- Frontend: Next.js (Vercel)
- Backend: Node.js / API routes
- Scraping: Cheerio + custom parser
- AI Layer: Claude API (Anthropic) — reasoning only
- DB: Supabase (scan history, user data, cache)
- Auth: Supabase Auth
- Billing: Stripe

---

## Core Modules

| Module | Layer | AI? |
|--------|-------|-----|
| scanner-engine | Rule engine | No |
| score-model | Calculation | No |
| ai-insight-layer | LLM reasoning | Yes |
| dashboard-system | UI/state | No |
| billing-flow | Stripe | No |
| free-vs-premium | Gate logic | No |

---

## Two-Layer Architecture Rule

### Layer 1 — Rule Engine (cheap, fast, deterministic)
Runs on EVERY scan, free and premium.
- Schema.org detection
- llms.txt / robots.txt check
- H1/H2 structure
- Open Graph completeness
- Page speed (via fetch timing)
- Freshness (meta date tags)
- Answer-first detection (NLP-light, no LLM)
- Entity links detection

### Layer 2 — LLM Layer (expensive, premium only)
Runs ONLY for premium users or first-time free scan (cached 7 days).
- Semantic authority reasoning
- Niche clarity interpretation
- Insight blocks (strongest point, critical gap, quick win, paradox)
- Hero summary sentence
- AI recommendation signal analysis
- Authority evaluation narrative

**Rule:** Never call LLM for Layer 1 checks. Never use regex for Layer 2 reasoning.

---

## Chat Separation for Claude Code

Each feature = separate chat context. Never load full project in one chat.

| Chat | Scope | Key files |
|------|-------|-----------|
| A | Scanner Engine | scanner-engine.md + ScannerService.ts |
| B | Score Model | score-model.md + ScoreCalculator.ts |
| C | AI Insight Layer | ai-insight-layer.md + InsightEngine.ts |
| D | Dashboard UI | dashboard-system.md + Dashboard*.tsx |
| E | Billing & Auth | billing-flow.md + auth/stripe files |
| F | Free vs Premium gate | free-vs-premium.md + GateService.ts |

**Prompt format for Claude Code:**
"Read [filename].md only. Then update [ComponentName].tsx. Do not refactor unrelated files."

---

## Global Rules for Claude Code
- Do not redesign layouts unless explicitly asked
- Do not rename existing variables or functions unless broken
- Do not install new packages without confirming
- Preserve agency positioning on nurdai.com integration
- All new components go in /components/genessa/
- All API routes go in /app/api/genessa/

---

## Caching Rules
- Same domain → cache LLM result for 7 days
- Rule engine → no cache, always fresh
- Free scan → cache shown to user, rescan blocked for 7 days per domain
- Premium → rescan anytime, history stored

---

## Ignore List for Claude Code
Never scan or include:
- node_modules/
- .next/
- dist/ build/
- logs/ exports/ tmp/
- screenshots/
- *.lock files

---

## Teknik Borç — Unutma

Bu sorunlar bilinçli olarak ertelendi. Supabase entegrasyonunda çözülecek.

| Sorun | Nerede | Çözüm |
|-------|--------|-------|
| In-memory cache çalışmıyor | /api/audit/route.ts | Supabase'de `scan_cache` tablosu yap, domain + tarih tut |
| Authority score null | /api/audit/route.ts | score-model.md'deki 6 signal hesabı implement edilecek |
| Email capture console.log | score/page.tsx | Supabase'e kaydet, email gönder |
| 7 günlük scan limiti sahte | /api/audit/route.ts | Cache Supabase'e taşınınca gerçek olacak |

**Supabase entegrasyonu = bu 4 sorun çözülüyor.**
