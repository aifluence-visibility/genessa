# GENESSA — PUBLIC API & STORE INTEGRATIONS

## Amaç
Genessa'nın AI asistanlar üzerinden kullanılabilmesi.
GPT Store (OpenAI) ve Claude integrations için API hazırlığı.

---

## Nasıl Çalışır

Kullanıcı ChatGPT veya Claude'da şunu yazar:
> "genessa.com ile nurdai.com sitemi analiz et"

GPT veya Claude → Genessa API'ına istek atar → sonuçları kullanıcıya sunar.

Bunun için gerekli:
1. Public API endpoint (zaten var: `/api/audit`)
2. API key authentication
3. OpenAPI spec dosyası (GPT/Claude bunu okur)
4. Rate limiting

---

## API Endpoint Tasarımı

### Temel endpoint
```
GET https://genessa.io/api/v1/audit?url=https://example.com

Headers:
  Authorization: Bearer {api_key}

Response:
{
  "domain": "example.com",
  "scannedAt": "2026-05-22T...",
  "scores": {
    "readiness": { "score": 68, "checks": [...] },
    "authority":  { "score": 52, "signals": [...] },
    "influence":  { "score": null, "locked": true }
  },
  "insights": {
    "hero_text": "AI systems understand your niche...",
    "blocks": [
      { "type": "strongest_point", "text": "..." },
      { "type": "critical_gap",    "text": "..." }
    ]
  },
  "fixes": [
    { "check": "schema", "points": 15, "action": "Add Organization JSON-LD" },
    ...
  ]
}
```

### Versiyonlama
`/api/v1/audit` — her zaman v1 prefix kullan.
Store entegrasyonları eski versiyona bağlı kalır, seni yeni versiyona geçiş yapmak zorunda bırakmaz.

---

## API Key Sistemi

### Key tipleri
| Tip | Limit | Kimler alır |
|-----|-------|------------|
| Free API key | 10 istek/gün | Kayıt olan herkes |
| Starter key | 100 istek/gün | Starter plan |
| Pro key | 1000 istek/gün | Pro plan |

### Key üretimi
Dashboard'da "API Keys" sekmesi → "Generate key" → kopyala.
Key format: `gns_live_xxxxxxxxxxxxxxxx` (32 char random)

### Supabase'de saklama
```
table: api_keys
  id, user_id, key_hash (not plaintext!), 
  plan, daily_limit, requests_today, created_at
```

---

## OpenAPI Spec (GPT Store için)

Bu dosyayı projeye ekle: `public/openapi.json`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Genessa AI Visibility API",
    "description": "Analyze any website's AI visibility score",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://genessa.io/api/v1" }
  ],
  "paths": {
    "/audit": {
      "get": {
        "summary": "Analyze a website's AI visibility",
        "parameters": [
          {
            "name": "url",
            "in": "query",
            "required": true,
            "description": "The website URL to analyze",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "AI visibility analysis results"
          }
        },
        "security": [{ "bearerAuth": [] }]
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  }
}
```

Bu dosyayı GPT Store'da "Action" eklerken URL olarak ver:
`https://genessa.io/openapi.json`

---

## GPT Store Entegrasyonu

### Adımlar
1. GPT oluştur: "Genessa AI Visibility Analyzer"
2. Description: "Analyze any website's AI visibility score using Genessa"
3. Action ekle → OpenAPI URL: `https://genessa.io/openapi.json`
4. Auth: API Key (Bearer) — kullanıcı kendi key'ini girer
5. Publish → GPT Store'a gönder

### GPT System Prompt
```
You are an AI visibility analyst powered by Genessa.
When a user asks to analyze a website:
1. Call the audit API with their URL
2. Present results in a clear, consultant-level format
3. Highlight the 3 most important improvements
4. Always mention the full report is available at genessa.io
```

---

## Claude Integration (MCP)

Claude için MCP (Model Context Protocol) server oluşturulur.

### Basit yol (şimdilik)
Claude'un "integrations" veya "tools" sistemi açıldığında aynı OpenAPI spec kullanılır.
Şu an için GPT Store öncelikli, Claude sonra.

### MCP Server (ilerisi için)
```typescript
// mcp-server/index.ts
// Tool: analyze_website
// Input: { url: string }
// Output: AI visibility report
```

Faz 3'te implement edilir.

---

## Privacy Policy Gereksinimi

GPT Store ve Claude Store her ikisi de privacy policy zorunlu tutar.
`genessa.io/privacy` sayfası şunları içermeli:
- API'dan hangi veriler toplanıyor
- Scan edilen URL'ler kaydediliyor mu (evet, cache için)
- Kullanıcı verileri 3. taraflarla paylaşılıyor mu (hayır)
- GDPR / CCPA notu

---

## MD Etkileri

Bu dosyanın eklenmesiyle güncellenmesi gereken diğer MD'ler:

### master-architecture.md → şu satırı ekle
```
API Public Layer:
- /api/v1/audit (public, API key auth)
- /api/v1/keys (dashboard, API key management)
- public/openapi.json (GPT/Claude store spec)
```

### billing-flow.md → şu plan satırını ekle
```
| Developer | $29/ay | API access 1000 req/day | headless kullanım |
```

### dashboard-system.md → şu bileşeni ekle
```
ApiKeyPanel.tsx — key üret, kopyala, kullanım istatistikleri
```

---

## Geliştirme Sırası

Store entegrasyonu için minimum gereksinimler:
1. `/api/v1/audit` endpoint (mevcut `/api/audit` güncelle)
2. API key auth middleware
3. `public/openapi.json` dosyası
4. Rate limiting (basit: Supabase'de counter)
5. GPT Store'da action kur ve test et

Bu 5 adım = GPT Store'da çalışan entegrasyon.
Dashboard API key paneli ve billing entegrasyonu sonra gelir.
