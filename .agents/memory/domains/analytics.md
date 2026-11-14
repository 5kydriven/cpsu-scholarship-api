<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: domain.analytics
tag: [TAG:ANALYTICS]
domain: Analytics Metrics, Natural-Language Chat & Prediction Reporting
updated: 2026-11-14T22:07:35+08:00
relevant_services:
  - src/services/analytics.service.ts
  - src/services/eligibility_suggestions.service.ts
relevant_models:
  - src/db/schema/eligibility_suggestions.ts
  - src/db/schema/applications.ts
  - src/db/schema/student_allowlist.ts
---

# Domain: Analytics Metrics, Natural-Language Chat & Prediction Reporting `[TAG:ANALYTICS]`

## 1. Domain Overview
Personnel-only analytics exposes metric definitions, filtered scalar/breakdown/series/prediction results, and optional Cloudflare AI chat. Classification resolves human-readable course/program/offering names through existing repositories and falls back deterministically when AI is unavailable or malformed.

---

## 2. Core Service Architecture

| Service / Class | File Path | Responsibility & Rules |
|---|---|---|
| `createAnalyticsService` | [`src/services/analytics.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/analytics.service.ts) | **Analytics orchestration**: validates metric options, resolves filters, formats results, and logs query/chat telemetry. |
| `createEligibilitySuggestionsService` | [`src/services/eligibility_suggestions.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/eligibility_suggestions.service.ts) | **Prediction source**: provides suggestion runs consumed by analytics prediction metrics. |

---

## 3. Key Models & Schema

| Model / Entity | Table | PK | Key Attributes / Relationships |
|---|---|---|---|
| `analytics repo` | `derived queries` | n/a | counts, breakdowns, time series, and prediction-run summaries over domain tables. |
| `eligibilitySuggestionRuns` | `eligibility_suggestion_runs` | uuid | prediction metadata and criteria snapshot used in analytics. |
| `applications / students / allowlist` | `applications / students / student_allowlist` | uuid | source entities for analytics counts and filters. |

---

## 4. Invariant Rules for Analytics Metrics, Natural-Language Chat & Prediction Reporting
- All analytics routes require auth and at least the personnel role.
- Supported filters are validated against each metric before repository execution.
- AI classification and answer generation are optional; deterministic classifier/fallback paths must remain functional.
- Current tests use node:test and typed repository doubles; keep chat tests independent of live AI bindings.
