<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: domain.payouts
tag: [TAG:PAYOUTS]
domain: Payouts, Claim Windows & Release
updated: 2026-11-14T22:07:35+08:00
relevant_services:
  - src/services/payouts.service.ts
  - src/services/applications.service.ts
relevant_models:
  - src/db/schema/payouts.ts
  - src/db/schema/applications.ts
  - src/db/schema/program_offerings.ts
  - src/db/schema/staff_profiles.ts
---

# Domain: Payouts, Claim Windows & Release `[TAG:PAYOUTS]`

## 1. Domain Overview
Payouts are created during application approval and move from pending to released. Personnel open claim windows; the owning student submits check details. Repository transactions re-check ownership, approval, pending status, archive state, and school-year cutoff before mutation.

---

## 2. Core Service Architecture

| Service / Class | File Path | Responsibility & Rules |
|---|---|---|
| `createPayoutsService` | [`src/services/payouts.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/payouts.service.ts) | **Payout lifecycle**: lists student payouts, opens personnel claim windows, and releases owner-submitted checks. |
| `createApplicationsService` | [`src/services/applications.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/applications.service.ts) | **Payout creation trigger**: approval calculates payout amount and inserts semester payouts inside the approval transaction. |

---

## 3. Key Models & Schema

| Model / Entity | Table | PK | Key Attributes / Relationships |
|---|---|---|---|
| `payouts` | `payouts` | uuid | applicationId, semester, numeric amount, pending/released status, claim and release metadata. |
| `application cutoff` | `applications` | uuid | maxPayoutSy limits future offering school years. |
| `staff profile links` | `staff_profiles` | uuid | claimableBy and releasedBy identify staff actors. |

---

## 4. Invariant Rules for Payouts, Claim Windows & Release
- Only personnel can open claims; only the owning student can submit a check and release a payout.
- Release requires approved application, pending payout, claimable flag, non-archived offering, and valid school-year cutoff.
- Use repository transactions for claim and release mutations; preserve atomic state transitions.
- Monetary values use fixed-scale PostgreSQL numeric columns; do not introduce float persistence.
