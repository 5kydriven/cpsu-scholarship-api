<!-- TEMPLATE_VERSION: 2.0.0 -->
# Global Agent Guardrails & Invariants

Applies to every agent and workflow in CPSU Scholarship API.

## Human authority
- User approves scope, architecture, and final release.
- Never declare completion, commit, push, or open a PR without explicit approval.

## Surgical changes
- Make the smallest diff that satisfies acceptance criteria.
- Do not reformat untouched files, refactor unrelated code, or add unapproved dependencies.

## Reuse and context
- Read `.agents/memory/INDEX.md` before design or implementation.
- Check `memory/catalogs/services.md` before creating helpers or services.
- Load only the domain chunk named by the router; never load the full memory tree.

## Project invariants
- IDs: text in Better Auth tables; UUID defaultRandom() in scholarship-domain tables.
- Numeric values: preserve PostgreSQL fixed-scale numeric storage; avoid float persistence.
- Multi-table mutations: use Drizzle `db.transaction` in repositories.
- No tenant/organization model exists; do not invent tenant scoping.
- Layering: routes/handlers → services → repositories → Drizzle schema.

## Gates
- Stop at Gate 0, Gate 1, and the User Final Verdict until the user approves.
- Cap automated review remediation at three cycles; escalate further failure to the user.