<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: domain.identity-access
tag: [TAG:AUTH]
domain: Identity, Access & Onboarding
updated: 2026-11-14T22:07:35+08:00
relevant_services:
  - src/services/student_allowlist.service.ts
  - src/services/students.service.ts
  - src/services/staff_profiles.service.ts
relevant_models:
  - src/db/schema/auth.ts
  - src/db/schema/student.ts
  - src/db/schema/student_allowlist.ts
  - src/db/schema/staff_profiles.ts
---

# Domain: Identity, Access & Onboarding `[TAG:AUTH]`

## 1. Domain Overview
Better Auth owns email/password identities and sessions. `withAuth` hydrates auth, user, and session context; route-level `requireAuth` and `requireRole` enforce access. Student onboarding uses the allowlist and student profile services; staff administration is restricted by role.

---

## 2. Core Service Architecture

| Service / Class | File Path | Responsibility & Rules |
|---|---|---|
| `createStudentAllowlistService` | [`src/services/student_allowlist.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/student_allowlist.service.ts) | **Onboarding gate**: verifies student numbers, imports allowlist rows, and marks registrations. |
| `createStudentsService` | [`src/services/students.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/students.service.ts) | **Student profile**: finds students by user or student number and updates submitted profiles. |
| `createStaffProfilesService` | [`src/services/staff_profiles.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/staff_profiles.service.ts) | **Staff administration**: manages staff profiles and synchronized user roles. |

---

## 3. Key Models & Schema

| Model / Entity | Table | PK | Key Attributes / Relationships |
|---|---|---|---|
| `user / session / account / verification` | `Better Auth tables` | text | email/password identity, cookie sessions, linked accounts, verification records. |
| `student` | `students` | uuid | userId, studentNumber, courseId; links to user, allowlist, and course. |
| `studentAllowlist` | `student_allowlist` | uuid | unique studentNumber; registration flags and user references. |
| `staffProfiles` | `staff_profiles` | uuid | unique userId; department, position, and contact data. |

---

## 4. Invariant Rules for Identity, Access & Onboarding
- Roles are `student < personnel < admin`; keep `USER_ROLES` and `ROLE_HIERARCHY` synchronized.
- Authentication is hydrated globally but protection is explicit at route registration.
- No tenant or organization isolation model was found; do not invent tenant scoping.
- Student registration must pass allowlist verification before profile creation and user linkage.
