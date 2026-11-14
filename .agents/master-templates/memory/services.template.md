<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: catalog.services
tag: [TAG:SERVICES]
title: Active Core Services & Factory Catalog
updated: {{ISO_TIMESTAMP}}
---

# Active Core Services & Factory Catalog `[TAG:SERVICES]`

> **Reuse Invariant**: Before implementing new business logic, drivers, or pipelines, check this catalog. Reusing existing services prevents duplicate logic and preserves architectural integrity.

---

{{#DISCOVERED_SERVICES_BY_DOMAIN}}
## {{DOMAIN_NAME}}

| Service / Class | File Path | Method / Capability | Reuse Rule |
| :--- | :--- | :--- | :--- |
| `{{SERVICE_NAME}}` | [`{{SERVICE_FILE}}`](file:///{{WORKSPACE_ROOT}}/{{SERVICE_FILE}}) | {{SERVICE_CAPABILITY}} | **REUSE** for {{SERVICE_REUSE_CONDITIONS}} |
{{/DISCOVERED_SERVICES_BY_DOMAIN}}
