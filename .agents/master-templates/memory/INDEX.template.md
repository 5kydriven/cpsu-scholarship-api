<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: memory.index
title: Agent Memory Master Router
updated: {{ISO_TIMESTAMP}}
version: 2.0.0
---

# Agent Memory Master Router

> **Context Optimization Rule**: Agents must never load the entire memory directory. Check this index table, identify the relevant domain tag, and read **only** the designated file.

---

## 1. Domain & Catalog Routing Table

| Knowledge Area | Grep Tag | File Link | Scope & Purpose | When to Load |
| :--- | :--- | :--- | :--- | :--- |
| **System Invariants** | `[TAG:CONVENTIONS]` | [`conventions.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/conventions.md) | Architectural rules, primary keys, precision, idempotency, multi-tenancy, auth. | Read by Architect, Reviewer, and Implementer on any feature. |
<!-- Master Agent populates discovered domain chunks below -->
{{#DOMAIN_ROUTING_ROWS}}
| **Active Service Catalog** | `[TAG:SERVICES]` | [`catalogs/services.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/catalogs/services.md) | Verified active services and reusable domain logic. | Read when looking for reusable business logic before writing new code. |
| **Database Schema** | `[TAG:SCHEMA]` | [`catalogs/models-schema.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/catalogs/models-schema.md) | Clustered database schema (Anchor entities + Compressed lookups). | Read during architecture planning or writing queries/relationships. |
| **Historical Archive** | `[TAG:ARCHIVE]` | [`MEMORY_ARCHIVE.md`](file:///{{WORKSPACE_ROOT}}/.agents/MEMORY_ARCHIVE.md) | Durable change history and completed feature logs. | Appended by Release Manager. Never auto-loaded during development. |

---

## 2. Fast Keyword Grep Index

Agents can find specific topics using `grep_search` across `.agents/memory/` using these anchor tags:

- `[TAG:CONVENTIONS]` → Coding standards, transactions, architecture conventions
{{#DOMAIN_TAG_LIST}}
- `[TAG:SERVICES]` → Active service method signatures & capabilities
- `[TAG:SCHEMA]` → Database tables, Foreign keys, Model relations
