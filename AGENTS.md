# AGENTS.md

## 1. Overview

This repository is a Cloudflare Worker API for the CPSU scholarship domain, organized around typed Hono/OpenAPI routes, Better Auth session context, service-layer business logic, Drizzle repositories, and R2 file uploads. Keep new code aligned with the existing route, handler, service, repository, schema, middleware, and database boundaries.

## 2. Folder Structure

- `src/index.ts`: entry point; creates `OpenAPIHono<AppEnv>`, registers error handling, CORS, `/openapi.json`, `/docs`, logger, database/auth middleware, root health text, and mounted `/api/v1/*` routes.
- `src/modules`: HTTP-facing modules with sibling OpenAPI route contracts, handlers, and Zod schemas.
  - Current modules include `auth`, `courses`, `staff_profiles`, `student_allowlists`, `scholarship_programs`, `program_offerings`, `applications`, `parents`, `addresses`, and `files`.
- `src/services`: business logic factories. Services receive repositories as dependencies, coordinate domain workflows, and translate failures into typed application errors.
- `src/repositories`: database access factories. Repositories receive `Db`, own Drizzle queries, joins/relations, persistence details, pagination mechanics, and `null` returns for missing rows.
- `src/middleware`: reusable request pipeline steps that read/write Hono context variables or enforce access.
- `src/lib`: shared primitives such as Better Auth setup, typed errors, pagination, OpenAPI helpers, common schemas, Drizzle-Zod factories, auth headers, and student-number normalization.
- `src/utils`: reusable utilities outside core app factories, such as uploaded file validation and crypto helpers.
- `src/db`: database client creation, schema exports, generated migrations, and seed SQL.
  - `schema`: Drizzle table definitions and schema barrel exports.
  - `migrations`: generated Drizzle migration SQL and metadata; treat as generated artifacts.
  - `seeds`: seed SQL scripts.
- `src/types`: shared environment, context-variable, role, pagination, and auth user types.
- `src/constants`: reusable enum-like maps and helpers for roles and error codes.
- Root config files (`package.json`, `tsconfig.json`, `wrangler.jsonc`, `drizzle.config.ts`): runtime, TypeScript, Worker, and migration configuration.
- `worker-configuration.d.ts`: generated Cloudflare bindings/runtime types; avoid hand-editing.
- `hono-api-architecture.md`: architectural reference. Follow it only where it matches current source, and do not assume unimplemented folders exist.

## 3. Core Behaviors & Patterns

- **Request pipeline**: `src/index.ts` creates `new OpenAPIHono<AppEnv>()`, installs `errorHandler`, applies CORS, exposes OpenAPI JSON and Scalar docs, then installs logger, `dbMiddleware()`, `withAuth`, the root health route, and mounted domain routes.
- **Context hydration**: middleware uses Hono variables as shared request state. `dbMiddleware()` stores `db`; `withAuth` stores `auth`, `user`, and `session`. Handlers should read these with `c.get(...)`.
- **Database lifecycle**: `createDbConnection(databaseUrl)` branches by hostname. Local databases use a dynamic `pg` client and return a `dispose` callback; non-local URLs reuse a cached Neon HTTP Drizzle client. Middleware owns cleanup in `finally`.
- **Route contract boundary**: route files define `createRoute(...)` contracts, schemas, routers, public/protected wiring, and route-level middleware. Do not put business rules or Drizzle queries in route files.
- **Handler boundary**: handlers stay thin. They read validated input or multipart bodies, build the service from context dependencies, call one service method, and return the declared response with explicit status codes.
- **Service boundary**: business logic belongs in `src/services`. Services receive repositories through `createDomainService(...)`, may inject multiple repositories for multi-resource workflows, and throw `Errors.*` for domain failures.
- **Repository boundary**: repositories own Drizzle access. They receive `Db` through `createDomainRepo(db)`, compose filters/search/sort/pagination, update timestamps, use `.returning()`, and normalize absent records to `null`.
- **Pagination flow**: repositories return raw offset or cursor primitives; handlers wrap them with `createOffsetPage(...)` or `createCursorPage(...)`. Query schemas should reuse `OffsetQuerySchema`, `CursorQuerySchema`, and domain-specific sort/search extensions.
- **Auth boundary**: `createAuth(db, env)` centralizes Better Auth configuration, Drizzle adapter mapping, email/password auth, default role metadata, and trusted origins. Route handlers call `auth.api.*` through context.
- **Auth header propagation**: Better Auth APIs are called with `returnHeaders: true`. Both `withAuth` and auth handlers copy returned headers to the Hono response, appending `Set-Cookie` specially and forwarding other headers normally.
- **Protected route flow**: authentication is globally hydrated by `withAuth`, but route-level protection is explicit. Public routes are wired before guards; protected groups use `requireAuth` and, when needed, `requireRole(...)` before protected OpenAPI handlers.
- **Error boundary**: `errorHandler` flattens thrown errors into `{ error: { code, message, details } }`. It handles `AppError`, Hono `HTTPException`, Better Auth `APIError`, and `ZodError`; unknown errors are logged.
- **Role enforcement**: roles are ordered from `viewer` to `admin`. `requireRole(minimumRole)` checks `c.get('user')`, throws 401 when absent, and compares rank for 403 decisions. If roles change, update all role definitions and rank maps together.
- **Schema-to-response shape**: schemas are Zod objects with OpenAPI examples. Handlers must return the exact envelope declared by the route schema, including pagination, auth, file upload, and no-content responses.
- **File upload flow**: multipart handlers parse bodies directly, validate `File` objects, write accepted streams to `c.env.R2`, and return public URLs based on `c.env.PUBLIC_URL`.
- **Drizzle schema exports**: table files define constants with `pgTable(...)` and export inferred select/insert types. `src/db/schema/index.ts` re-exports schema files for shared imports.

## 4. Conventions

- **Module files**: feature modules use a domain folder with `domain.route.ts`, `domain.handler.ts`, and `domain.schema.ts`.
- **Service files**: domain services live in `src/services/domain.service.ts`, export `createDomainService(...)`, and usually export `type DomainService = ReturnType<typeof createDomainService>`.
- **Repository files**: domain repositories live in `src/repositories/domain.repo.ts`, export `createDomainRepo(db)`, and usually export `type DomainRepo = ReturnType<typeof createDomainRepo>`.
- **Handler factories**: handlers commonly define a local `getDomainService(c: Context<AppEnv>)` helper that builds repositories from `c.get('db')` and injects them into the service.
- **Route names**: individual route definitions use lower camel case plus `Route` (`createCourseRoute`, `listCoursesRoute`, `meRoute`). The mounted router uses the domain name plus `Route` (`coursesRoute`, `authRoute`).
- **Handler names**: handlers are action verbs or short endpoint names (`createCourse`, `listCourses`, `login`, `logout`, `me`) and are exported from the domain handler file.
- **Schema names**: Zod schemas use PascalCase plus `Schema` for manually named schemas and lower camel case for table-derived CRUD schemas (`CourseParamsSchema`, `courseInsertSchema`).
- **Drizzle-Zod schemas**: prefer `createSelectSchema`, `createInsertSchema`, and `createUpdateSchema` from `src/lib/drizzle-zod.ts`; omit generated fields with `generatedFields`.
- **OpenAPI helpers**: use `jsonBody`, `jsonOk`, `jsonCreated`, `deletedNoContent`, and shared error response helpers instead of hand-writing repeated OpenAPI response objects.
- **Middleware names**: middleware files are kebab-case (`with-auth.ts`, `require-auth.ts`, `error-handler.ts`). Exported middleware is lower camel case and reads like a pipeline step or guard (`withAuth`, `requireAuth`, `requireRole`, `dbMiddleware`).
- **Factory names**: shared constructors use `create*` names (`createAuth`, `createDbConnection`, `createCoursesService`). Keep factory responsibilities narrow and return typed values rather than mutating globals, except for intentional caches like `neonDbCache`.
- **Types**: exported types and interfaces use PascalCase (`AppEnv`, `AppBindings`, `AppVariables`, `UserRole`, `AuthUser`). Inferred Drizzle types follow entity names (`User`, `NewUser`, `AuthSession`, `NewCourse`).
- **Constants**: enum-like objects and maps use uppercase names when they represent shared constants (`ErrorCode`, `ROLE_HIERARCHY`). Error code values are `UPPER_SNAKE_CASE` strings.
- **Database naming**: TypeScript table objects use lower camel case or plural entity names (`user`, `session`, `courses`). Database columns are snake_case in Drizzle definitions (`email_verified`, `created_at`), while TypeScript properties stay camelCase (`emailVerified`, `createdAt`).
- **Imports**: external packages come first, then internal app imports, then relative same-module imports. Use `import type` for type-only dependencies. Prefer the `@/` alias for cross-directory source imports and relative imports for sibling module files.
- **Function style**: exported functions are usually `const` arrow functions with explicit framework types when they cross Hono boundaries. Guard clauses and early returns are preferred.
- **Response construction**: handlers return `c.json(payload, status)`, `c.body(null, 204)` for no-content deletes, and `c.text(...)` for root text responses. Update route schemas before changing envelopes.
- **Error construction**: use `HTTPException` for Hono boundary guard failures. Use `Errors.*`/`AppError` for application-domain errors with stable codes and details.
- **Context variables**: if middleware sets a new `c.set(...)` variable, add its type to `AppVariables` in `src/types/app.ts` before consuming it elsewhere.
- **Environment bindings**: application code reads runtime values from `c.env` or `CloudflareBindings`-typed env parameters. Keep binding names synchronized with generated Worker types.
- **Comments**: source comments are rare and short. Preserve generated-file headers, and add comments only when they explain non-obvious boundary behavior or generated artifacts.

## 5. Working Agreements

- Respond in the user's preferred language; if unspecified, use English and keep technical terms in English.
- Do not modify or translate fenced code blocks in user-provided content.
- Ask before introducing new tests, lint rules, formatter setup, external dependencies, or broad architecture changes.
- Before editing, review related route wiring, handlers, services, repositories, schemas, context variables, and generated/config boundaries.
- Solve the user's request with the smallest focused change that fits the current codebase; report meaningful side effects or mismatches found during analysis.
- Preserve public API behavior unless the user asks to change it, especially route response shapes, auth/session behavior, pagination envelopes, and file upload response URLs.
- Put new business rules in services, not handlers or repositories. Put new persistence mechanics in repositories, not handlers or route files.
- Run type-check after code changes with `bun run typecheck` (`tsc --noEmit`) when dependencies are available. Documentation-only changes do not require runtime tests.
- New functions/modules should be single-purpose and colocated with the nearest existing route, service, repository, middleware, lib, db, or type concern.
- Avoid new external dependencies unless necessary, and explain why if one is added.
