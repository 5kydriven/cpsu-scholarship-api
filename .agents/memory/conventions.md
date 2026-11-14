<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: memory.conventions
tag: [TAG:CONVENTIONS]
title: System Architecture & Coding Conventions
updated: 2026-11-14T22:07:35+08:00
---

# System Architecture & Coding Conventions `[TAG:CONVENTIONS]`

**Project:** CPSU Scholarship API (TypeScript / Hono OpenAPI on Cloudflare Workers)

---

## 1. Core Architectural Invariants

1. **Primary Keys & Identity Strategy:**
   - Mixed by bounded schema: text IDs in Better Auth tables; UUID defaultRandom() IDs in scholarship-domain tables. standardized across all models/entities.
   - Do not mix identity strategies without explicit architectural authorization.

2. **Zero Float Precision & Arithmetic:**
   - **Financial calculations & currency:** Persist monetary and GWA values in PostgreSQL numeric columns as fixed-scale decimal strings; avoid introducing binary-float persistence.
   - **Quotas, counters & integer units:** Strict integer arithmetic.

3. **Relational Integrity & Foreign Keys:**
   - Strict relational DB foreign keys across all parent-child and polymorphic relationships.
   - No unindexed string lookups or orphaned child rows.

4. **Transaction & Idempotency Rules:**
   - Use Drizzle db.transaction for multi-table state changes; keep transaction boundaries in repositories and rely on database unique/foreign-key constraints for integrity.
   - External mutation triggers (webhooks, event listeners) must verify idempotency keys before state changes.
   - Concurrency protection: Enforce database locking or atomic operations on mutable counters.



6. **Authentication & Authorization:***
   - Better Auth email/password sessions with requireAuth and role middleware (admin, personnel, student).
   - Role-based and permission boundaries enforced via middleware/policies before domain operations.

7. **Layering & Structural Invariants:**
   - OpenAPI routes define contracts and guards; handlers adapt HTTP input/output; services own domain rules; repositories own Drizzle queries and persistence.
   - Controllers/Handlers: HTTP validation, tenancy resolution, response formatting only.
   - Services/Domain: Business rules, transactions, external side effects.

8. **Testing Standards:**
   - Test framework: `bun run test`
   - Test invariants: Use node:test with typed repository doubles; keep tests isolated, deterministic, and independent of live Cloudflare bindings or a shared database.


## 9. Repository-Specific Notes
- Runtime: Cloudflare Workers; local development and migrations use Bun/Wrangler/Drizzle Kit.
- No tenant or organization entity/middleware exists in the scanned codebase; authorization is role-based.
- Current code converts some PostgreSQL numeric strings with `Number()` for comparisons. Preserve fixed-scale storage and review precision at every new money path.
