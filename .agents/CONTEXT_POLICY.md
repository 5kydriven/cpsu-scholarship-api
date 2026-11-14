<!-- TEMPLATE_VERSION: 2.0.0 -->
# Context Budget & Boundary Policy

**Objective**: Maximize signal and minimize token waste while preserving 100% engineering rigor, security, and human control.

---

## 1. Universal Context Budget Rules

1. **Rule 1 — Targeted Discovery**: Never scan or list the entire repository when targeted glob/grep searches suffice.
2. **Rule 2 — Single-Source Consumption**: Never re-read an artifact or file whose relevant information was already captured in the current context or task packet.
3. **Rule 3 — Surgical Surface**: Prefer reading changed files and their immediate siblings over entire module directories.
4. **Rule 4 — Diff-Centric Verification**: Prefer `git diff` combined with acceptance criteria over open-ended repository-wide review.
5. **Rule 5 — Lean Propagation**: Prefer structured summaries and compact machine-readable artifacts over propagating full conversational histories.
6. **Rule 6 — Compact Artifacts**: Use structured headers and bullet points instead of verbose narrative reports.
7. **Rule 7 — Modular Memory Reads**: Load only the specific domain chunk under `.agents/memory/domains/*.md` or `catalogs/*.md` required for the task. Never load the entire memory tree.
8. **Rule 8 — Complexity-Proportional Agentization**: Do not spawn additional agents when a task fits a smaller complexity tier (SMALL / MEDIUM).
9. **Rule 9 — Targeted Verification**: Run targeted test files during development; run the full test suite only during final QA or release preparation.
10. **Rule 10 — Bounded Investigation**: Stop codebase search once unambiguous evidence is found.

---

## 2. Memory Tier Architecture

To prevent global memory bloat while maintaining persistent architecture knowledge:

| Memory Tier | Location | Scope & Purpose | Access Policy |
| :--- | :--- | :--- | :--- |
| **Master Router** | [`.agents/memory/INDEX.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/INDEX.md) (or [`.agents/MEMORY.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/MEMORY.md)) | Master table of contents, grep tag matrix, domain pointers. | Loaded first (~150 tokens) to determine which chunk to read. |
| **System Invariants** | [`.agents/memory/conventions.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/conventions.md) | Architectural rules, primary keys, precision, multi-tenancy, auth. | Read by Architect / Reviewer / Implementer across all tasks. |
| **Domain Memory Chunks** | `.agents/memory/domains/<domain>.md` | Subsystem architecture per functional domain. | Read **only** when active task touches that specific domain. |
| **Catalog Chunks** | `.agents/memory/catalogs/<catalog>.md` | Quick lookup for Services and Database Schemas. | Read on demand for method signatures and schema definitions. |
| **Task Memory** | `.agent-work/<TASK_ID>/` | Ephemeral task context, task packets, plans, review findings, QA matrices. | Owned by active feature pipeline. Read only by agents involved in `<TASK_ID>`. |
| **History Archive** | [`.agents/MEMORY_ARCHIVE.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/MEMORY_ARCHIVE.md) | Full-fidelity change history and completed feature logs. | Appended by Release Manager upon user approval. Never auto-loaded during active development. |

---

## 3. Agent Context Boundary Matrix

Every agent operates within defined context boundaries:

### Agent 0: Task Context Builder
* **ALWAYS READ**: User prompt, [`.agents/memory/INDEX.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/INDEX.md), [`.agents/memory/conventions.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/conventions.md).
* **READ WHEN NEEDED**: Relevant domain chunk under `.agents/memory/domains/*.md` if clarifying task scope.
* **DO NOT READ**: Full memory directory, testing rules, release workflows, full service files.

### Agent 1: Software Architect
* **ALWAYS READ**: `TASK_CONTEXT.md` / `TASK_PACKET.md`, target domain chunk under `.agents/memory/domains/*.md`, [`.agents/memory/conventions.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/conventions.md).
* **READ WHEN NEEDED**: [`.agents/memory/catalogs/services.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/catalogs/services.md), [`.agents/memory/catalogs/models-schema.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/catalogs/models-schema.md), sibling classes for pattern matching.
* **DO NOT READ**: `MEMORY_ARCHIVE.md`, unrelated domain chunks, QA/Release workflows.

### Agent 2: Implementation Engineer
* **ALWAYS READ**: `TASK_PACKET.md`, `ARCHITECTURE_PLAN.md`, `IMPLEMENTATION_TASKS.md`, `ACCEPTANCE_CRITERIA.md`.
* **READ WHEN NEEDED**: Exact files to modify, sibling classes, [`.agents/memory/catalogs/services.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/catalogs/services.md) for utility lookup.
* **DO NOT READ**: `TASK_CONTEXT.md` (distilled in plan), unrelated domain chunks, full memory tree.

### Agent 3: Code Reviewer (Diff-Centric)
* **ALWAYS READ**: `git diff`, `ACCEPTANCE_CRITERIA.md`, `ARCHITECTURE_PLAN.md` (§Security & §Reused Components).
* **READ WHEN NEEDED**: [`.agents/memory/conventions.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/memory/conventions.md), immediate sibling lines of changed files.
* **DO NOT READ**: `TASK_CONTEXT.md`, `REQUIREMENT.md`, `QA_CRITERIA.md`, `IMPLEMENTATION_PLAN.md`, domain chunks.

### Agent 4: QA Validator
* **ALWAYS READ**: `ACCEPTANCE_CRITERIA.md`, `QA_CRITERIA.md`, `CODE_REVIEW.md` (findings summary), `git diff`.
* **READ WHEN NEEDED**: Test files, relevant model factories/seeders.
* **DO NOT READ**: Full architecture discussions, `TASK_CONTEXT.md`, memory chunks, unit tests of untouched domains.

### Agent 5: Release Manager
* **ALWAYS READ**: `IMPLEMENTATION_REPORT.md` (file list), `CODE_REVIEW.md` (verdict), `QA_REPORT.md` (verdict), [`.agents/MEMORY.md`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/.agents/MEMORY.md) (recent change index).
* **READ WHEN NEEDED**: `git status`, `git diff --stat`.
* **DO NOT READ**: Full architecture documents, test plans, detailed review discussions.
