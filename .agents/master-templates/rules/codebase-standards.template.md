<!-- TEMPLATE_VERSION: 2.0.0 -->
# Global Agent Guardrails & Invariants

> **Universal Rule**: These invariants apply across all agent interactions, turns, and workflows within **{{PROJECT_NAME}}**.

---

## 1. Human Authority & Approval Gates
- **User is the Final Authority**: Never declare a feature complete, commit, push, or open a PR without explicit user confirmation (`"complete"`, `"approved"`, `"looks good"`).
- **Mandatory Pauses**: Respect all gating points (Gate 0 Scope, Gate 1 Architecture, User Final Verdict).

## 2. Surgical Modifications (Zero Unrequested Refactoring)
- **Minimal Diffs**: Make the smallest surgical change required to satisfy acceptance criteria.
- **Preserve Integrity**: Do not reformat untouched files, modify unrelated logic, or introduce new unrequested packages/architectural layers.

## 3. Reusability & Zero Duplicate Logic
- **Check Memory First**: Inspect [`.agents/memory/INDEX.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/INDEX.md) and [`catalogs/services.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/catalogs/services.md) before writing new helpers, services, or utilities.
- **Never Recreate Existing Utilities**: If a domain service, action, or helper exists, reuse it.

## 4. Architectural Invariants
- **Conventions Compliance**: Strictly adhere to [`.agents/memory/conventions.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/conventions.md):
  - Primary Keys: {{PRIMARY_KEY_STRATEGY}}
  - Precision: {{MONEY_PRECISION_RULE}}
  - Idempotency & Transactions: {{TRANSACTION_RULE}}
{{#IF HAS_TENANCY}}
  - Security & Tenancy: {{TENANCY_RULE}}
{{/IF}}

## 5. Context Budget & Boundary Policy
- **Modular Loading**: Load only designated domain chunks under `.agents/memory/domains/` per [`.agents/CONTEXT_POLICY.md`](file:///{{WORKSPACE_ROOT}}/.agents/CONTEXT_POLICY.md). Never load the entire memory tree.
