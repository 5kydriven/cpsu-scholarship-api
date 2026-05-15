import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jsonBody, jsonCreated } from '@/lib/openapi-helpers';
import {
	conflict,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';
import { requireAuth } from '@/middleware/require-auth';
import type { AppEnv } from '@/types/app';
import { createApplication } from './applications.handler';
import {
	applicationInsertSchema,
	applicationWithRelationsSchema,
} from './applications.schema';

export const createApplicationRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Applications'],
	summary: 'Create an application with required parent records',
	request: {
		body: jsonBody(applicationInsertSchema),
	},
	responses: {
		201: jsonCreated(applicationWithRelationsSchema),
		401: unauthorized,
		409: conflict,
		422: validationError,
	},
});

export const applicationsRoute = new OpenAPIHono<AppEnv>();

applicationsRoute.use('/*', requireAuth);
applicationsRoute.openapi(createApplicationRoute, createApplication);
