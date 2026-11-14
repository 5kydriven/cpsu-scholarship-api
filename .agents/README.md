# CPSU Scholarship API Agent OS

Generated in FRESH mode on 2026-11-14T22:07:35+08:00.

Start here:

1. Read `.agents/memory/INDEX.md` and `.agents/CONTEXT_POLICY.md`.
2. Route new work through `.agents/agents/orchestrator/agent.md`.
3. Use `.agents/workflows/multiple-agent-workflow.md` for features and `.agents/workflows/hotfix-workflow.md` for urgent fixes.
4. Store task artifacts under `.agent-work/<TASK_ID>/`.
5. Run `python3 .agents/scripts/manage-state.py --action=init --task=feat/<slug> --complexity=MEDIUM`.
6. Run `python3 .agents/scripts/validate-artifact.py` at each handoff gate.
7. Run `python3 .agents/scripts/sync-catalogs.py` after service/schema changes.

Project facts: TypeScript, Hono OpenAPI, Cloudflare Workers, Drizzle ORM, PostgreSQL/Neon, Better Auth, Bun, and `bun run test` using `tsx --test`.

The generated rules are intentionally lean. QA and workflow-optimization personas are on-demand skills, not always-on rules.
