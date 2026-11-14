<!-- TEMPLATE_VERSION: 2.0.0 -->
# Codebase Inventory & Memory Router

**Last Updated:** {{ISO_TIMESTAMP}}  
**Project:** {{PROJECT_NAME}} ({{PRIMARY_LANGUAGE}} / {{FRAMEWORK}})  
**Memory Architecture:** Clustered High-Signal Modular Memory (v2.0)

> [!TIP]
> **Token Optimization Notice:** Memory is organized into modular domain chunks under [`.agents/memory/`](file:///{{WORKSPACE_ROOT}}/.agents/memory/INDEX.md). Agents must load **only** the relevant domain chunk for their specific task.

---

## 1. Domain Memory Router

| Knowledge Domain | Grep Anchor | Target Chunk File | Scope Summary |
| :--- | :--- | :--- | :--- |
| **System Invariants** | `[TAG:CONVENTIONS]` | [`.agents/memory/conventions.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/conventions.md) | Primary keys, precision, idempotency, multi-tenancy, auth. |
{{#ROUTER_DOMAIN_ROWS}}
| **Active Service Catalog** | `[TAG:SERVICES]` | [`.agents/memory/catalogs/services.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/catalogs/services.md) | Verified active services and helper registry. |
| **Database Schema** | `[TAG:SCHEMA]` | [`.agents/memory/catalogs/models-schema.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/catalogs/models-schema.md) | Clustered database schema (Anchor entities + Compressed lookups). |
| **Master Index** | `[TAG:INDEX]` | [`.agents/memory/INDEX.md`](file:///{{WORKSPACE_ROOT}}/.agents/memory/INDEX.md) | Complete index and tag lookup directory. |

---

## 2. Recent Change History Index

> Detailed change logs and historical records are archived in [MEMORY_ARCHIVE.md](file:///{{WORKSPACE_ROOT}}/.agents/MEMORY_ARCHIVE.md).

| Timestamp | Type | TASK_ID | Description | Artifacts |
| :--- | :--- | :--- | :--- | :--- |
<!-- Release Manager appends recent tasks below -->
{{#RECENT_CHANGE_ROWS}}
