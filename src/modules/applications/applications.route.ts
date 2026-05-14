import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { requireAuth } from '@/middleware/require-auth';
import {
	conflict,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';
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
		body: {
			content: {
				'application/json': {
					schema: applicationInsertSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				'application/json': { schema: applicationWithRelationsSchema },
			},
			description: 'Created',
		},
		401: unauthorized,
		409: conflict,
		422: validationError,
	},
});

export const applicationsRoute = new OpenAPIHono<AppEnv>();

applicationsRoute.use('/*', requireAuth);
applicationsRoute.openapi(createApplicationRoute, createApplication);
