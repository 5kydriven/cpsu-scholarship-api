<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: domain.{{DOMAIN_SLUG}}
tag: [TAG:{{DOMAIN_TAG}}]
domain: {{DOMAIN_TITLE}}
updated: {{ISO_TIMESTAMP}}
relevant_services:
{{#DOMAIN_SERVICES}}
  - {{SERVICE_FILE}}
{{/DOMAIN_SERVICES}}
relevant_models:
{{#DOMAIN_MODELS}}
  - {{MODEL_FILE}}
{{/DOMAIN_MODELS}}
---

# Domain: {{DOMAIN_TITLE}} `[TAG:{{DOMAIN_TAG}}]`

## 1. Domain Overview
{{DOMAIN_SUMMARY}}

---

## 2. Core Service Architecture

| Service / Class | File Path | Responsibility & Rules |
| :--- | :--- | :--- |
{{#DOMAIN_SERVICE_ROWS}}
| `{{SERVICE_NAME}}` | [`{{SERVICE_FILE}}`](file:///{{WORKSPACE_ROOT}}/{{SERVICE_FILE}}) | **{{SERVICE_ROLE}}**: {{SERVICE_DESCRIPTION}} |
{{/DOMAIN_SERVICE_ROWS}}

---

## 3. Key Models & Schema

| Model / Entity | Table | PK | Key Attributes / Relationships |
| :--- | :--- | :--- | :--- |
{{#DOMAIN_MODEL_ROWS}}
| `{{MODEL_NAME}}` | `{{TABLE_NAME}}` | {{PRIMARY_KEY_STRATEGY}} | {{MODEL_ATTRIBUTES_AND_RELATIONS}} |
{{/DOMAIN_MODEL_ROWS}}

---

## 4. Invariant Rules for {{DOMAIN_TITLE}}
{{#DOMAIN_INVARIANTS}}
- {{INVARIANT_RULE}}
{{/DOMAIN_INVARIANTS}}
