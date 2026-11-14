<!-- TEMPLATE_VERSION: 2.0.0 -->
---
name: agentic-workflow-optimizer
description: Playbook for auditing, refactoring, and optimizing agentic operating systems, subagents, context budgets, and memory systems for maximum signal and minimum token burning.
---

# Agentic Workflow & Token Optimization Playbook

Use this skill when designing, reviewing, auditing, or optimizing AI agent operating systems, subagent topologies, context policies, or repository memory architectures.

---

## 1. The 5 Anti-Patterns of Bloated Agent Systems

| Anti-Pattern | Root Cause | Symptom / Token Impact | Remediation |
| :--- | :--- | :--- | :--- |
| **1. The Monolithic Memory Trap** | Storing all project architecture, services, schema, and history in a single `MEMORY.md`. | Memory file swells to 10k+ tokens; agents load irrelevant context on every task. | Deconstruct into **4-Tier Progressive Disclosure** (`INDEX.md` + `domains/` + `catalogs/`). |
| **2. Always-On Persona Pollution** | Placing specialized agent personas (e.g., QA Engineer, Reviewer) in global `.agents/rules/`. | Injected into **every turn of every agent**, causing persona collisions and burning ~1,000+ tokens/turn. | Move personas to **on-demand skills** or worker agent contracts. Compress rules to **~25-line guardrails**. |
| **3. The Raw Directory Dump** | Listing every simple CRUD controller, form request, and lookup table in memory. | Massive token bloat with zero architectural value. | Detail only **Anchor Entities** and compress simple lookups into single-line taxonomy summaries. |
| **4. Flat Complexity Execution** | Running a full 6-agent waterfall pipeline for an isolated 1-line typo fix. | Burns 20k+ tokens for trivial edits. | Enforce **Task Complexity Routing** (SMALL → Direct, MEDIUM → Review, LARGE → Full Waterfall). |
| **5. Infinite Automated Loops** | Allowing subagents to loop indefinitely on failed reviews or tests. | Runaway token spend without converging. | Enforce **Circuit Breakers (Max 3 cycles)** before escalating to human authority. |

---

## 2. The 5-Step Optimization Methodology

### Step 1: Deconstruct Memory into Progressive Disclosure Tiers
Never load the full memory directory. Structure memory as follows:
- **Tier 0 (Master Router Index):** `.agents/memory/INDEX.md` (<200 tokens) with grep anchors (`[TAG:*]`) and when-to-load triggers.
- **Tier 1 (System Invariants):** `.agents/memory/conventions.md` (~300 tokens) covering primary keys, zero-float precision, idempotency, and multi-tenancy rules.
- **Tier 2 (Bounded Domain Chunks):** `.agents/memory/domains/<domain>.md` (~350–450 tokens) containing subsystem rules, relevant services, and model lists. Loaded **only** when touching that specific domain.
- **Tier 3 (Reference Catalogs):**
  - `catalogs/services.md`: 100% verified active services on disk (zero phantom classes).
  - `catalogs/models-schema.md`: Clustered schema tables for Anchor Entities + 1-line compressed lookups.
- **Tier 4 (Cold Storage):** `MEMORY_ARCHIVE.md` for durable completed task logs.

### Step 2: Audit & Purge Always-On Rules
- Verify that `.agents/rules/` contains **only universal non-negotiable invariants**:
  1. Human authority & gating.
  2. Minimal surgical diffs (zero unrequested refactoring).
  3. Memory lookup before writing code (reusability invariant).
  4. Core architectural conventions.
  5. Context budget compliance.
- Keep total rules size **under 2.0 KB (<400 tokens)**.

### Step 3: Enforce Formal Context Policies
Create `.agents/CONTEXT_POLICY.md` specifying exact boundaries for every agent role:
- **Agent 0 (Context Builder):** Reads `INDEX.md` + `conventions.md`.
- **Agent 1 (Architect):** Reads `TASK_PACKET.md` + target domain chunk + `services.md`.
- **Agent 2 (Implementer):** Reads `ARCHITECTURE_PLAN.md` + `services.md` (on-demand).
- **Agent 3 (Code Reviewer):** Reads `git diff` against `conventions.md`.
- **Agent 4 (QA Validator):** Reads `git diff` and test files (never loads memory).
- **Agent 5 (Release Manager):** Appends `MEMORY_ARCHIVE.md` and updates `MEMORY.md`.

### Step 4: Implement Task Complexity Routing
Classify every incoming request into a complexity tier:
- **SMALL:** Typo, single null check, config tweak → Orchestrator → Implementation → Targeted Test.
- **MEDIUM:** Single endpoint, query scope, refactor → Architect → Implementation → Code Review → User Gate.
- **LARGE:** Multi-tenancy, payments, auth, migrations → Full 6-Agent Waterfall with all 3 Human Gates.

### Step 5: Enforce Circuit Breakers & Human Gating
- Cap automated review/QA remediation loops at **3 cycles**. On the 4th failure, halt and present the blocker to the human user.
- Enforce the **3 Mandatory Human Gates**:
  - **Gate 0:** User confirms scope and `TASK_ID`.
  - **Gate 1:** User approves architecture plan and tasks before code edits.
  - **User Final Verdict Gate:** User confirms manual verification before release, commit, or PR.

---

## 3. Token Efficiency Benchmarks (Real-World Impact)

| Metric | Before Optimization | After Optimization | Efficiency Gain |
| :--- | :--- | :--- | :--- |
| **Always-On Rules Overhead** | ~2,800 tokens / turn | ~350 tokens / turn | **~87% token reduction** |
| **Domain Feature Memory Load** | ~2,500+ tokens (monolith) | ~400 tokens (targeted chunk) | **~84% token reduction** |
| **Initial Memory Router Load** | ~2,500+ tokens (monolith) | ~180 tokens (`INDEX.md`) | **~92% token reduction** |
| **Adversarial QA Persona Injection** | Injected on every turn (all agents) | Loaded on-demand only by QA | **Zero persona pollution** |
| **Small Task Overhead** | Full 6-agent cycle (~30k tokens) | Direct implementation (~2k tokens) | **~93% token reduction** |

---

## 4. Verification Checklist for Any Repository

When auditing an existing agent setup, check:
- [ ] Is `MEMORY.md` under 50 lines (serving only as a slim router)?
- [ ] Are all active services verified on disk with zero phantom/stale classes?
- [ ] Are simple lookup models compressed into a single line in `catalogs/models-schema.md`?
- [ ] Is `.agents/rules/` under 2.0 KB and free of agent personas?
- [ ] Does `.agents/CONTEXT_POLICY.md` exist and define strict boundaries?
- [ ] Does the workflow support SMALL / MEDIUM / LARGE complexity routing?
- [ ] Is there a hard circuit breaker capping automated fail loops at 3 cycles?
