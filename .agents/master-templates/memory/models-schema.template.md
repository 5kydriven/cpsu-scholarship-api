<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: catalog.models_schema
tag: [TAG:SCHEMA]
title: Clustered Models & Database Schema Catalog
updated: {{ISO_TIMESTAMP}}
---

# Clustered Models & Database Schema Catalog `[TAG:SCHEMA]`

> **Standard Convention**: Primary Key strategy is **{{PRIMARY_KEY_STRATEGY}}** across all relational tables.

---

{{#DISCOVERED_MODEL_CLUSTERS}}
## {{CLUSTER_INDEX}}. {{CLUSTER_NAME}}

| Model / Entity | Table | PK | Key Columns | Relationships / Invariants |
| :--- | :--- | :--- | :--- | :--- |
| `{{MODEL_NAME}}` | `{{TABLE_NAME}}` | {{PRIMARY_KEY_STRATEGY}} | {{KEY_COLUMNS}} | {{RELATIONSHIPS}} |
{{/DISCOVERED_MODEL_CLUSTERS}}

---

## Compressed Taxonomy & Lookup Models

- **Lookups & Enums:** {{COMPRESSED_LOOKUP_MODELS_LIST}}
- *All lookup models use standard {{PRIMARY_KEY_STRATEGY}} primary keys and key-value naming.*
