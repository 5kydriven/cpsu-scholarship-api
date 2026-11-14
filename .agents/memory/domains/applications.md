<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: domain.applications
tag: [TAG:APPLICATIONS]
domain: Applications, Supporting Documents & Review
updated: 2026-11-14T22:07:35+08:00
relevant_services:
  - src/services/applications.service.ts
  - src/services/parents.service.ts
  - src/services/addresses.service.ts
relevant_models:
  - src/db/schema/applications.ts
  - src/db/schema/parents.ts
  - src/db/schema/addresses.ts
  - src/modules/files/files.handler.ts
---

# Domain: Applications, Supporting Documents & Review `[TAG:APPLICATIONS]`

## 1. Domain Overview
Applications aggregate student, offering, course, parent, address, and uploaded-document data. Handlers validate OpenAPI payloads, services apply workflow rules, and repositories own relation loading, pagination, review transitions, and approval transactions.

---

## 2. Core Service Architecture

| Service / Class | File Path | Responsibility & Rules |
|---|---|---|
| `createApplicationsService` | [`src/services/applications.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/applications.service.ts) | **Application workflow**: creates composite applications, accepts/rejects review decisions, and maps pagination responses. |
| `createParentsService` | [`src/services/parents.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/parents.service.ts) | **Parent records**: CRUD and batch creation scoped by application persistence. |
| `createAddressesService` | [`src/services/addresses.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/addresses.service.ts) | **Address records**: CRUD and batch creation for application addresses. |

---

## 3. Key Models & Schema

| Model / Entity | Table | PK | Key Attributes / Relationships |
|---|---|---|---|
| `applications` | `applications` | uuid | unique student/offering pair; pending → under_review/approved/rejected; review and payout metadata. |
| `parents` | `parents` | uuid | applicationId, parent type, vital status, occupation, monthly income. |
| `addresses` | `addresses` | uuid | applicationId, permanent/current type, location fields. |
| `uploaded files` | `R2 object storage` | object key | validated multipart files produce PUBLIC_URL-backed URLs; no relational file table observed. |

---

## 4. Invariant Rules for Applications, Supporting Documents & Review
- Application routes require auth; personnel guards protect listing and review mutations.
- The student/offering uniqueness constraint prevents duplicate applications.
- Approval runs in a repository transaction, checks budget, marks the student as scholar, and creates two pending payouts.
- Composite create has compensating deletion on downstream failure; preserve this behavior or replace it with an explicit transaction when changing the workflow.
