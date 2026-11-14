<!-- TEMPLATE_VERSION: 2.0.0 -->
---
id: domain.scholarship-programs
tag: [TAG:PROGRAMS]
domain: Scholarship Programs, Offerings & Eligibility
updated: 2026-11-14T22:07:35+08:00
relevant_services:
  - src/services/courses.service.ts
  - src/services/scholarship_programs.service.ts
  - src/services/program_offerings.service.ts
  - src/services/eligibility_suggestions.service.ts
relevant_models:
  - src/db/schema/course.ts
  - src/db/schema/scholarship_program.ts
  - src/db/schema/program_offerings.ts
  - src/db/schema/eligibility_suggestions.ts
---

# Domain: Scholarship Programs, Offerings & Eligibility `[TAG:PROGRAMS]`

## 1. Domain Overview
Personnel manage courses, scholarship programs, program offerings, and eligibility suggestion runs. Offerings carry school-year, budget, semester amounts, active/archive state, and database checks. Eligibility generation ranks pending applications against a captured criteria snapshot.

---

## 2. Core Service Architecture

| Service / Class | File Path | Responsibility & Rules |
|---|---|---|
| `createCoursesService` | [`src/services/courses.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/courses.service.ts) | **Course catalog**: CRUD plus offset/cursor pagination for course records. |
| `createScholarshipProgramsService` | [`src/services/scholarship_programs.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/scholarship_programs.service.ts) | **Program catalog**: CRUD with soft archive behavior and paginated reads. |
| `createProgramOfferingsService` | [`src/services/program_offerings.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/program_offerings.service.ts) | **Offering lifecycle**: CRUD, soft deletion, budget fields, active/archive constraints, and pagination. |
| `createEligibilitySuggestionsService` | [`src/services/eligibility_suggestions.service.ts`](file:///C:/Users/5kydriven/Documents/personal-projects/cpsu-scholarship-hono/src/services/eligibility_suggestions.service.ts) | **Eligibility ranking**: generates one ranked run per offering and moves selected applications under review. |

---

## 3. Key Models & Schema

| Model / Entity | Table | PK | Key Attributes / Relationships |
|---|---|---|---|
| `courses` | `courses` | uuid | name, abbreviation, major; referenced by students and applications. |
| `scholarshipPrograms` | `scholarship_programs` | uuid | name, description, isArchived. |
| `programOfferings` | `program_offerings` | uuid | programId, schoolYear, numeric budgets, active/archive check. |
| `eligibilitySuggestionRuns / eligibilitySuggestions` | `eligibility_suggestion_runs / eligibility_suggestions` | uuid | unique offering run; ranked application rows and criteria snapshot. |

---

## 4. Invariant Rules for Scholarship Programs, Offerings & Eligibility
- Personnel role is required for program, offering, and eligibility endpoints.
- An offering cannot be both active and archived; eligibility generation is only for inactive offerings.
- One eligibility suggestion run per offering is enforced by a unique index and a service conflict check.
- Numeric budget, GWA, and income values are persisted as PostgreSQL numerics with fixed scale.
