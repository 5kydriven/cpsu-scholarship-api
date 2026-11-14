<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: memory.conventions
tag: [TAG:CONVENTIONS]
title: System Architecture & Coding Conventions
updated: {{ISO_TIMESTAMP}}
---

# System Architecture & Coding Conventions `[TAG:CONVENTIONS]`

**Project:** {{PROJECT_NAME}} ({{PRIMARY_LANGUAGE}} / {{FRAMEWORK}})

---

## 1. Core Architectural Invariants

1. **Primary Keys & Identity Strategy:**
   - {{PRIMARY_KEY_STRATEGY}} standardized across all models/entities.
   - Do not mix identity strategies without explicit architectural authorization.

2. **Zero Float Precision & Arithmetic:**
   - **Financial calculations & currency:** {{MONEY_PRECISION_RULE}}
   - **Quotas, counters & integer units:** Strict integer arithmetic.

3. **Relational Integrity & Foreign Keys:**
   - Strict relational DB foreign keys across all parent-child and polymorphic relationships.
   - No unindexed string lookups or orphaned child rows.

4. **Transaction & Idempotency Rules:**
   - {{TRANSACTION_RULE}}
   - External mutation triggers (webhooks, event listeners) must verify idempotency keys before state changes.
   - Concurrency protection: Enforce database locking or atomic operations on mutable counters.

{{#IF HAS_TENANCY}}
5. **Multi-Tenancy Isolation:**
   - {{TENANCY_RULE}}
   - Tenant scoping enforced across query builders, repositories, and route middleware. Cross-tenant queries strictly forbidden.
{{/IF}}

6. **Authentication & Authorization:**
   - {{AUTH_MECHANISM}}
   - Role-based and permission boundaries enforced via middleware/policies before domain operations.

7. **Layering & Structural Invariants:**
   - {{LAYERING_RULE}}
   - Controllers/Handlers: HTTP validation, tenancy resolution, response formatting only.
   - Services/Domain: Business rules, transactions, external side effects.

8. **Testing Standards:**
   - Test framework: `{{TEST_RUNNER_COMMAND}}`
   - Test invariants: {{TEST_INVARIANTS}}

{{#EXTRA_CONVENTIONS}}
