# Hono API Architecture

## 1. Overview

This repository is a Vercel Node Functions API starter built with Hono, `@hono/zod-openapi`, Better Auth, Drizzle, and PostgreSQL. The current source is organized around:

- `src/index.ts` as the application entry point.
- `src/modules/{domain}` for HTTP route contracts, handlers, and schemas.
- `src/repositories` for Drizzle query wrappers.
- `src/services` for domain orchestration and application errors.
- `src/db/schema` and `src/db/migrations` for persistence.
- `src/types/app.ts` for Hono bindings and context variables.
- `src/lib/env.ts` for runtime environment resolution across local and Vercel deployments.

This document describes the current structure first. Sections marked as optional or planned are patterns that can be added later; they are not required files in the current source tree.

## 2. Current Folder Structure

```txt
src/
  index.ts
  constants/
    error-codes.ts
    roles.ts
  db/
    index.ts
    schema/
      auth.ts
      course.ts
      index.ts
      user.ts
    migrations/
      *.sql
      meta/
  lib/
    auth.ts
    errors.ts
  middleware/
    db.ts
    error-handler.ts
    require-auth.ts
    require-role.ts
    with-auth.ts
  modules/
    auth/
      auth.handler.ts
      auth.route.ts
      auth.schema.ts
    courses/
      courses.handler.ts
      courses.route.ts
      courses.schema.ts
  repositories/
    courses.repo.ts
  services/
    courses.service.ts
  types/
    app.ts
    common.ts
    env.d.ts
```

Root configuration files:

- `package.json`: scripts and dependencies.
- `tsconfig.json`: TypeScript and `@/*` path alias configuration.
- `drizzle.config.ts`: Drizzle Kit migration configuration.

## 3. Layer Responsibilities

| Layer      | Files                        | Responsibility                                                                                    | Avoid                                          |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| App entry  | `src/index.ts`               | Register global middleware, docs, root route, and mounted modules                                 | Domain-specific business logic                 |
| Route      | `*.route.ts`                 | Define OpenAPI routes, mount route guards, wire handlers                                          | DB calls and business logic                    |
| Handler    | `*.handler.ts`               | Read validated input, read Hono context, call service or auth API, return declared response shape | Raw Drizzle queries                            |
| Service    | `src/services/*.service.ts`  | Orchestrate domain rules and throw `Errors.*`/`AppError`                                          | Hono `Context` and HTTP response construction  |
| Repository | `src/repositories/*.repo.ts` | Run Drizzle queries and return database results                                                   | HTTP concerns and response shaping             |
| Schema     | `*.schema.ts`                | Define Zod request/response schemas used by OpenAPI routes                                        | Imports from handler/service/repository layers |
| Middleware | `src/middleware/*.ts`        | Hydrate context or guard access                                                                   | Domain-specific persistence logic              |

Use the existing auth module as the implemented route/handler/schema reference. Use the courses module as the current CRUD-style reference.

## 4. App Entry Point

`src/index.ts` owns app-wide setup. The current order is:

1. Create `new OpenAPIHono<AppEnv>()`.
2. Register `app.onError(errorHandler)`.
3. Register CORS.
4. Register `/openapi.json`.
5. Register `/docs`.
6. Register `dbMiddleware()`.
7. Register global `withAuth`.
8. Register logger.
9. Register root text response.
10. Mount modules.

Current pattern:

```ts
const app = new OpenAPIHono<AppEnv>()

app.onError(errorHandler)

app.use('*', cors({ ... }))

app.doc('/openapi.json', (c) => ({
  openapi: '3.0.0',
  info: {
    title: 'Starter Template Hono API',
    version: '1.0.0',
  },
  servers: [{ url: new URL(c.req.url).origin }],
}))

app.get('/docs', Scalar({ url: '/openapi.json' }))

app.use('*', dbMiddleware())
app.use('*', withAuth)
app.use('*', logger())

app.get('/', (c) => c.text('Hello Hono!'))

app.route('/api/v1/auth', authRoute)
app.route('/api/v1/courses', coursesRoute)
```

Global middleware should only live in `src/index.ts` when it applies to every request. Domain-specific access rules should live in the module route file.

## 5. Types And Context

`src/types/app.ts` is the main Hono environment contract.

```ts
export type AppBindings = {
	DATABASE_URL: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
};

export type AppVariables = {
	db: Db;
	auth: Auth;
	user: {
		id: string;
		email: string;
		name: string;
		role: UserRole;
	} | null;
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	} | null;
};

export type AppEnv = {
	Bindings: AppBindings;
	Variables: AppVariables;
};
```

If middleware writes a new value with `c.set(...)`, add it to `AppVariables` before using `c.get(...)` elsewhere.

## 6. Auth Architecture

This project uses Better Auth, not a custom JWT middleware.

### Better Auth Factory

`src/lib/auth.ts` owns Better Auth setup:

- Drizzle adapter configuration.
- Schema mapping for Better Auth tables.
- Email/password auth.
- Default role metadata.
- Trusted origins.

Handlers and middleware should not rebuild Better Auth manually. They should use the `auth` value hydrated in Hono context.

### Global Auth Hydration

`src/middleware/with-auth.ts` runs globally after `dbMiddleware()`:

- Reads `db` from context.
- Creates `auth` with `createAuth(db, getAppEnv(c))`.
- Calls `auth.api.getSession(...)`.
- Sets `auth`, `user`, and `session` in context.
- Copies returned auth headers to the response.

This middleware does not protect routes by itself. It only hydrates request context.

### Route Guards

Use guards inside module route files:

- `requireAuth`: requires `c.get('user')`.
- `requireRole(minimumRole)`: requires a user and compares role rank.

Example:

```ts
resourcesRoute.openapi(listResourcesRoute, listResources);
resourcesRoute.openapi(getResourceRoute, getResource);
resourcesRoute.use('/', requireAuth);
resourcesRoute.openapi(createResourceRoute, createResource);
resourcesRoute.use('/:id', requireAuth);
resourcesRoute.openapi(updateResourceRoute, updateResource);
resourcesRoute.use('/:id', requireRole('admin'));
resourcesRoute.openapi(deleteResourceRoute, deleteResource);
```

### Auth Handler Pattern

Auth handlers call Better Auth APIs through context:

```ts
export const login: RouteHandler<typeof loginRoute, AppEnv> = async (c) => {
	const body = c.req.valid('json');
	const auth = c.get('auth');

	const result = await auth.api.signInEmail({
		body,
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	return c.json({ user: toAuthUser(result.response.user) }, 200);
};
```

When using `auth.api.*` with `returnHeaders: true`, always forward returned headers. Append `Set-Cookie` specially; copy other headers normally.

## 7. Response Shapes

Current successful responses are direct and route-specific. Do not introduce a new universal `{ data, meta }` envelope unless all affected route schemas and handlers are updated together.

### Auth Responses

Register/login:

```json
{
	"user": {
		"id": "user_123",
		"name": "Maria Santos",
		"email": "maria@example.com",
		"role": "student"
	}
}
```

Me:

```json
{
	"user": {
		"id": "user_123",
		"name": "Maria Santos",
		"email": "maria@example.com",
		"role": "student"
	},
	"session": {
		"id": "session_123",
		"userId": "user_123",
		"expiresAt": "2026-05-05T12:00:00.000Z"
	}
}
```

Logout returns Better Auth's logout response, currently represented by:

```json
{
	"success": true
}
```

### Single CRUD Resource

```json
{
	"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
	"name": "Example Resource",
	"createdAt": "2026-05-04T08:30:00.000Z",
	"updatedAt": "2026-05-04T08:30:00.000Z"
}
```

### Complete List With No Pagination

```json
[
	{
		"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		"name": "Example Resource",
		"createdAt": "2026-05-04T08:30:00.000Z",
		"updatedAt": "2026-05-04T08:30:00.000Z"
	}
]
```

### Paginated List

```json
{
	"rows": [
		{
			"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			"name": "Example Resource",
			"createdAt": "2026-05-04T08:30:00.000Z",
			"updatedAt": "2026-05-04T08:30:00.000Z"
		}
	],
	"meta": {
		"total": 84,
		"page": 2,
		"perPage": 20,
		"totalPages": 5,
		"hasNext": true,
		"hasPrev": true
	}
}
```

### Cursor List

Cursor pagination is implemented by courses and may be reused where useful:

```json
{
	"rows": [
		{
			"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			"name": "Example Resource",
			"createdAt": "2026-05-04T08:30:00.000Z",
			"updatedAt": "2026-05-04T08:30:00.000Z"
		}
	],
	"meta": {
		"nextCursor": "eyJpZCI6ImIyYzMifQ",
		"prevCursor": "eyJpZCI6ImExYjIifQ",
		"hasNext": true,
		"hasPrev": true,
		"perPage": 20
	}
}
```

### Error Responses

All thrown errors pass through `src/middleware/error-handler.ts` and return:

```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Resource not found",
		"details": []
	}
}
```

The error handler currently handles:

- `AppError`
- Hono `HTTPException`
- Better Auth `APIError`
- `ZodError`
- unknown errors as generic internal errors

## 8. Database Layer

`src/db/index.ts` owns database creation.

- Local `localhost` and `127.0.0.1` URLs use `pg` through a dynamic import and return a `dispose` callback.
- Non-local URLs use Neon HTTP and cache Drizzle clients by database URL.
- Drizzle is configured with `casing: 'snake_case'`.

`src/middleware/db.ts` owns request-time DB lifecycle:

- Creates the DB connection from `getAppEnv(c).DATABASE_URL`.
- Sets `db` in context.
- Cleans up local `pg` clients in `finally`.

Application code should read `c.get('db')`. Do not create new DB connections in handlers or services.

Schema files live in `src/db/schema` and are re-exported from `src/db/schema/index.ts`:

```ts
export * from './auth';
export * from './course';
```

Generated migrations live in `src/db/migrations`. Treat migration SQL and migration metadata as generated artifacts unless making a deliberate migration change.

## 9. Repositories

Repositories live in root-level `src/repositories`.

Repository rules:

- Accept `db: Db` through a `create*Repo(db)` factory.
- Import tables from `@/db/schema`.
- Run Drizzle queries.
- Return rows, totals, cursors, or `null`.
- Do not import Hono `Context`.
- Do not construct HTTP responses.

Example shape:

```ts
export const createResourcesRepo = (db: Db) => ({
	findAll: () => db.select().from(resources),

	findById: (id: string) =>
		db
			.select()
			.from(resources)
			.where(eq(resources.id, id))
			.limit(1)
			.then((r) => r[0] ?? null),

	create: (data: NewResource) =>
		db
			.insert(resources)
			.values(data)
			.returning()
			.then((r) => r[0]),

	update: (id: string, data: Partial<NewResource>) =>
		db
			.update(resources)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(resources.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	delete: (id: string) =>
		db
			.delete(resources)
			.where(eq(resources.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	findManyOffset: async ({
		page,
		perPage,
		search,
		sortField,
		sortOrder,
	}: ResourceListOptions) => {
		const offset = (page - 1) * perPage;
		const where = search ? ilike(resources.name, `%${search}%`) : undefined;
		const orderBy =
			sortOrder === 'asc'
				? asc(resources[sortField])
				: desc(resources[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db
				.select()
				.from(resources)
				.where(where)
				.orderBy(orderBy)
				.limit(perPage)
				.offset(offset),
			db.select({ value: count() }).from(resources).where(where),
		]);

		return { rows, total: Number(total) };
	},
});
```

## 10. Services

Services live in root-level `src/services`.

Service rules:

- Accept repositories through factory arguments.
- Contain domain decisions such as not-found checks.
- Throw `Errors.*` or `AppError` for application failures.
- Return plain data to handlers.
- Do not import Hono `Context`.

Example shape:

```ts
export const createResourcesService = (resourcesRepo: ResourcesRepo) => ({
	listAll() {
		return resourcesRepo.findAll();
	},

	listOffset(opts: ResourceListOptions) {
		return resourcesRepo.findManyOffset(opts);
	},

	async getById(id: string) {
		const resource = await resourcesRepo.findById(id);
		if (!resource) throw Errors.notFound('Resource not found');
		return resource;
	},

	create(data: CreateResourceInput) {
		return resourcesRepo.create(data);
	},

	async update(id: string, data: UpdateResourceInput) {
		const resource = await resourcesRepo.findById(id);
		if (!resource) throw Errors.notFound('Resource not found');
		return resourcesRepo.update(id, data);
	},

	async delete(id: string) {
		const resource = await resourcesRepo.findById(id);
		if (!resource) throw Errors.notFound('Resource not found');
		await resourcesRepo.delete(id);
	},
});
```

## 11. Implemented Auth Module Pattern

Auth is the best implemented module reference.

### Schema

`src/modules/auth/auth.schema.ts` defines:

- `RegisterSchema`
- `LoginSchema`
- `AuthUserSchema`
- `AuthResponseSchema`
- `SessionResponseSchema`
- `MeResponseSchema`
- `LogoutResponseSchema`

Schemas should match handler responses exactly.

### Route

`src/modules/auth/auth.route.ts`:

- Defines `createRoute(...)` route contracts.
- Creates `new OpenAPIHono<AppEnv>()`.
- Wires handlers with `authRoute.openapi(...)`.
- Mounts `requireAuth` immediately before protected handlers.

Pattern:

```ts
export const authRoute = new OpenAPIHono<AppEnv>();

authRoute.openapi(registerRoute, register);
authRoute.openapi(loginRoute, login);
authRoute.use('/logout', requireAuth);
authRoute.openapi(logoutRoute, logout);
authRoute.use('/me', requireAuth);
authRoute.openapi(meRoute, me);
```

### Handler

`src/modules/auth/auth.handler.ts`:

- Uses `RouteHandler<typeof routeDefinition, AppEnv>`.
- Reads validated JSON with `c.req.valid('json')`.
- Reads `auth`, `user`, and `session` from context.
- Calls `auth.api.*` for Better Auth flows.
- Copies returned auth headers.
- Returns direct response envelopes matching auth schemas.

## 12. Basic CRUD Placeholder Module

Use this placeholder structure when adding a new CRUD domain. Replace `resource` and `resources` with the domain name.

Required routes:

| Method   | Path                     | Purpose                          |
| -------- | ------------------------ | -------------------------------- |
| `GET`    | `/api/v1/resources/all`  | Complete list with no pagination |
| `GET`    | `/api/v1/resources`      | Paginated list with query params |
| `GET`    | `/api/v1/resources/{id}` | Read one resource                |
| `POST`   | `/api/v1/resources`      | Create resource                  |
| `PUT`    | `/api/v1/resources/{id}` | Update resource                  |
| `DELETE` | `/api/v1/resources/{id}` | Delete resource                  |

### `resources.schema.ts`

```ts
import { z } from '@hono/zod-openapi';

export const ResourceParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateResourceSchema = z.object({
	name: z.string().min(2).max(100).openapi({ example: 'Example Resource' }),
});

export const UpdateResourceSchema = z
	.object({
		name: z
			.string()
			.min(2)
			.max(100)
			.optional()
			.openapi({ example: 'Updated Resource' }),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: 'At least one resource field is required',
	});

export const ResourceResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ResourcesListResponseSchema = ResourceResponseSchema.array();

export const ResourcesOffsetQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
	perPage: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(20)
		.openapi({ example: 20 }),
	search: z.string().optional().openapi({ example: 'example' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const ResourcesOffsetResponseSchema = z.object({
	rows: ResourceResponseSchema.array(),
	meta: z.object({
		total: z.number().int().min(0),
		page: z.number().int().min(1),
		perPage: z.number().int().min(1),
		totalPages: z.number().int().min(0),
		hasNext: z.boolean(),
		hasPrev: z.boolean(),
	}),
});
```

### `resources.route.ts`

```ts
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import {
	createResource,
	deleteResource,
	getResource,
	listResources,
	listResourcesAll,
	updateResource,
} from './resources.handler';
import {
	CreateResourceSchema,
	ResourceParamsSchema,
	ResourceResponseSchema,
	ResourcesListResponseSchema,
	ResourcesOffsetQuerySchema,
	ResourcesOffsetResponseSchema,
	UpdateResourceSchema,
} from './resources.schema';

export const listResourcesAllRoute = createRoute({
	method: 'get',
	path: '/all',
	tags: ['Resources'],
	summary: 'List all resources',
	responses: {
		200: {
			content: { 'application/json': { schema: ResourcesListResponseSchema } },
			description: 'OK',
		},
	},
});

export const listResourcesRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Resources'],
	summary: 'List resources with pagination',
	request: { query: ResourcesOffsetQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: ResourcesOffsetResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const getResourceRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Resources'],
	summary: 'Get resource by ID',
	request: { params: ResourceParamsSchema },
	responses: {
		200: {
			content: { 'application/json': { schema: ResourceResponseSchema } },
			description: 'OK',
		},
		404: { description: 'Not found' },
	},
});

export const createResourceRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Resources'],
	summary: 'Create resource',
	request: {
		body: {
			content: { 'application/json': { schema: CreateResourceSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: { 'application/json': { schema: ResourceResponseSchema } },
			description: 'Created',
		},
		401: { description: 'Unauthorized' },
	},
});

export const updateResourceRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Resources'],
	summary: 'Update resource',
	request: {
		params: ResourceParamsSchema,
		body: {
			content: { 'application/json': { schema: UpdateResourceSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: ResourceResponseSchema } },
			description: 'OK',
		},
		401: { description: 'Unauthorized' },
		404: { description: 'Not found' },
	},
});

export const deleteResourceRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Resources'],
	summary: 'Delete resource',
	request: { params: ResourceParamsSchema },
	responses: {
		204: { description: 'Deleted' },
		401: { description: 'Unauthorized' },
		403: { description: 'Forbidden' },
		404: { description: 'Not found' },
	},
});

export const resourcesRoute = new OpenAPIHono<AppEnv>();

resourcesRoute.openapi(listResourcesAllRoute, listResourcesAll);
resourcesRoute.openapi(listResourcesRoute, listResources);
resourcesRoute.openapi(getResourceRoute, getResource);
resourcesRoute.use('/', requireAuth);
resourcesRoute.openapi(createResourceRoute, createResource);
resourcesRoute.use('/:id', requireAuth);
resourcesRoute.openapi(updateResourceRoute, updateResource);
resourcesRoute.use('/:id', requireRole('admin'));
resourcesRoute.openapi(deleteResourceRoute, deleteResource);
```

### `resources.handler.ts`

```ts
import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { createResourcesRepo } from '@/repositories/resources.repo';
import { createResourcesService } from '@/services/resources.service';
import type { AppEnv } from '@/types/app';
import type {
	createResourceRoute,
	deleteResourceRoute,
	getResourceRoute,
	listResourcesAllRoute,
	listResourcesRoute,
	updateResourceRoute,
} from './resources.route';

const getResourcesService = (c: Context<AppEnv>) =>
	createResourcesService(createResourcesRepo(c.get('db')));

export const listResourcesAll: RouteHandler<
	typeof listResourcesAllRoute,
	AppEnv
> = async (c) => {
	const rows = await getResourcesService(c).listAll();
	return c.json(rows, 200);
};

export const listResources: RouteHandler<
	typeof listResourcesRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const { rows, total } = await getResourcesService(c).listOffset({
		page,
		perPage,
		search,
		sortField: sort,
		sortOrder: order,
	});
	const totalPages = Math.ceil(total / perPage);

	return c.json(
		{
			rows,
			meta: {
				total,
				page,
				perPage,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		},
		200,
	);
};

export const getResource: RouteHandler<
	typeof getResourceRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const resource = await getResourcesService(c).getById(id);
	return c.json(resource, 200);
};

export const createResource: RouteHandler<
	typeof createResourceRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const resource = await getResourcesService(c).create(body);
	return c.json(resource, 201);
};

export const updateResource: RouteHandler<
	typeof updateResourceRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const resource = await getResourcesService(c).update(id, body);
	return c.json(resource, 200);
};

export const deleteResource: RouteHandler<
	typeof deleteResourceRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	await getResourcesService(c).delete(id);
	return c.body(null, 204);
};
```

## 13. Current Courses Module Notes

Courses follows the CRUD-style module pattern with these current endpoint choices:

- Public reads:
  - `GET /api/v1/courses`
  - `GET /api/v1/courses/cursor`
  - `GET /api/v1/courses/{id}`
- Protected writes:
  - `POST /api/v1/courses` requires `requireAuth`.
  - `PUT /api/v1/courses/{id}` requires `requireAuth`.
  - `DELETE /api/v1/courses/{id}` requires `requireRole('admin')`.

The course API uses `abbreviation` to match the database column. Do not use the misspelling `abbrevation` in new code.

## 14. Middleware

Implemented middleware:

- `dbMiddleware()`: creates and disposes the request DB connection.
- `withAuth`: hydrates Better Auth context.
- `requireAuth`: protects routes that require a signed-in user.
- `requireRole`: protects routes that require a minimum role.
- `errorHandler`: formats known and unknown errors.
- `hono/logger`: registered in `src/index.ts`.

Current middleware order:

```txt
cors
dbMiddleware
withAuth
logger
route handlers
```

Optional future middleware patterns:

- `request-id.ts`: attach a request ID to context and response headers.
- Custom logger middleware: include request ID and timing if request IDs are added.
- Rate limiting middleware: should be added only when a backing store is selected.

Do not document optional middleware as existing source until it is implemented.

## 15. OpenAPI And Docs

OpenAPI is generated from `createRoute(...)` definitions and Zod schemas.

Current endpoints:

- `GET /openapi.json`: raw OpenAPI document.
- `GET /docs`: Scalar API reference.

Route definitions should include:

- HTTP method and path.
- Tags and summary.
- Params, query, and body schemas where needed.
- Response schemas for successful JSON responses.
- Status descriptions for common errors.

Schemas must match handler output exactly. If a handler returns `{ rows, meta }`, the route response schema must describe `{ rows, meta }`.

## 16. Project Configuration

Current scripts:

```json
{
	"dev": "vercel dev --listen 8787",
	"deploy": "vercel deploy --prod",
	"deploy:preview": "vercel deploy",
	"vercel:pull": "vercel pull",
	"vercel:build": "vercel build",
	"docker:up": "docker compose up -d",
	"docker:down": "docker-compose down",
	"docker:clean": "docker-compose down -v",
	"db:generate": "bun drizzle-kit generate",
	"db:migrate": "bun drizzle-kit migrate",
	"db:studio": "bun drizzle-kit studio",
	"typecheck": "tsc --noEmit"
}
```

Use `bun run typecheck` after TypeScript changes when dependencies are available.

Use `bun run db:generate` when schema changes should create a new Drizzle migration.

## 17. Optional Planned Patterns

These patterns are useful for larger APIs but are not part of the current implemented source unless files are added later.

### Response Helpers

Optional helpers such as `ok`, `created`, `noContent`, or `paginated` may be added later. If added, update route schemas and handlers consistently. Do not mix helper-based envelopes with direct response shapes in the same endpoint family.

### WebSocket Module

Optional location:

```txt
src/modules/ws/ws.route.ts
```

If added, keep WebSocket state isolated from REST modules. For production, prefer a durable coordination mechanism instead of in-memory room maps.

### Cron Jobs

Optional locations:

```txt
src/cron/index.ts
src/cron/jobs/*.ts
```

If added, wire scheduled handlers through Vercel Cron Jobs and give them their own DB connection because they do not run through HTTP middleware.

### Future Domain Modules

Future modules should follow the same local shape:

```txt
src/modules/resources/
  resources.route.ts
  resources.handler.ts
  resources.schema.ts
src/repositories/resources.repo.ts
src/services/resources.service.ts
src/db/schema/resource.ts
```

After adding a module:

1. Export its schema table from `src/db/schema/index.ts`.
2. Mount its route in `src/index.ts`.
3. Generate a migration if the database schema changed.
4. Run `bun run typecheck`.

## 18. Request Flow Summary

```txt
Request
  -> CORS
  -> dbMiddleware sets db
  -> withAuth sets auth, user, session
  -> logger
  -> mounted module route
  -> route guard when configured
  -> OpenAPI/Zod validation
  -> handler
  -> service
  -> repository
  -> database

Errors
  -> errorHandler
  -> { error: { code, message, details } }
```

The main boundary to preserve: app-wide request setup belongs in `src/index.ts`; domain contracts and access rules belong in `src/modules/{domain}/{domain}.route.ts`; persistence stays behind repositories and services.
