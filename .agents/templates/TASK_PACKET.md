# Task Packet Specification & Template

The **Task Packet** is a lightweight, structured context container produced at the start of a feature pipeline or by the orchestrator. It ensures downstream agents receive task-specific context without having to rediscover the entire repository.

---

## Template (`.agent-work/<TASK_ID>/TASK_PACKET.yaml` or `TASK_PACKET.md`)

```yaml
task_id: <type>/<kebab-case-slug>
title: <Short imperative title>
complexity: <SMALL | MEDIUM | LARGE>
objective: <One-sentence summary of what is being changed and why>

scope:
  files:
    - <path/to/primary/file.php>
  modules:
    - <Domain or Module name, e.g., Payments, Users, JobSources>
  features:
    - <Feature name>

requirements:
  - <Precise requirement 1>
  - <Precise requirement 2>

constraints:
  - <Tenancy constraint, e.g., ScopedByClient enforced>
  - <Convention constraint, e.g., Reuse existing FormRequest>
  - <No new dependencies without approval>

architecture_decisions:
  - reuse: <ExistingService::method or Trait from MEMORY.md>
  - patterns: <Established pattern to match, e.g., Outbox pattern>

acceptance_criteria:
  - <Verifiable condition 1, e.g., GET /endpoint returns 200 with schema>
  - <Verifiable condition 2, e.g., 403 returned on cross-tenant access>

known_risks:
  - <Potential risk 1, e.g., N+1 query on relationship>
  - <Potential risk 2, e.g., race condition on balance decrement>

previous_findings:
  - <If re-entering pipeline after review/QA failure, list specific defects to fix>

required_output:
  - <List of required handoff artifacts based on complexity tier>
```

---

## Complexity Routing Guidelines

| Tier | When to Use | Assigned Agents | Required Artifacts |
| :--- | :--- | :--- | :--- |
| **SMALL** | Typos, minor bug fixes, field rename, config tweak, simple validation rule | Implementation Engineer (or Orchestrator direct) | `git diff` |
| **MEDIUM** | Single new endpoint, model query scope, multi-file tweak, service refactor | Architect → Implementation → Code Review | `ARCHITECTURE_PLAN.md`, `IMPLEMENTATION_PLAN.md`, `CODE_REVIEW.md` |
| **LARGE** | Auth, payments, financial logic, multi-tenancy, cross-domain, schema changes | Full 6-Agent Pipeline with Gates | Full artifact chain + User Gates |
