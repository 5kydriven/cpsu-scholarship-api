import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	deletedNoContent,
	jsonBody,
	jsonCreated,
	jsonOk,
} from '@/lib/openapi-helpers';
import {
	conflict,
	forbidden,
	notFound,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';
import { CursorQuerySchema } from '@/lib/pagination';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import {
	acceptApplication,
	acceptApplications,
	createApplication,
	deleteApplication,
	getApplication,
	listApplications,
	listApplicationsCursor,
} from './applications.handler';
import {
	acceptApplicationsBodySchema,
	acceptApplicationsResponseSchema,
	applicationInsertSchema,
	applicationWithRelationsSchema,
	ApplicationsCursorResponseSchema,
	ApplicationsOffsetQuerySchema,
	ApplicationsOffsetResponseSchema,
	ApplicationsParamsSchema,
} from './applications.schema';

export const listApplicationsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Applications'],
	summary: 'List applications (admin/personnel only)',
	request: { query: ApplicationsOffsetQuerySchema },
	responses: {
		200: jsonOk(ApplicationsOffsetResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const listApplicationsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Applications'],
	summary: 'List applications with cursor pagination (admin/personnel only)',
	request: { query: CursorQuerySchema },
	responses: {
		200: jsonOk(ApplicationsCursorResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const getApplicationRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Applications'],
	summary: 'Get application by ID (admin/personnel only)',
	request: { params: ApplicationsParamsSchema },
	responses: {
		200: jsonOk(applicationWithRelationsSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

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

export const deleteApplicationRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Applications'],
	summary: 'Delete application by ID (admin/personnel only)',
	request: { params: ApplicationsParamsSchema },
	responses: {
		204: deletedNoContent,
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const acceptApplicationRoute = createRoute({
	method: 'post',
	path: '/{id}/accept',
	tags: ['Applications'],
	summary: 'Accept an application (admin/personnel only)',
	request: {
		params: ApplicationsParamsSchema,
	},
	responses: {
		200: jsonOk(applicationWithRelationsSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
		409: conflict,
		422: validationError,
	},
});

export const acceptApplicationsRoute = createRoute({
	method: 'post',
	path: '/accept',
	tags: ['Applications'],
	summary: 'Accept multiple applications (admin/personnel only)',
	request: {
		body: jsonBody(acceptApplicationsBodySchema),
	},
	responses: {
		200: jsonOk(acceptApplicationsResponseSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
		409: conflict,
		422: validationError,
	},
});

export const applicationsRoute = new OpenAPIHono<AppEnv>();

applicationsRoute.use('/*', requireAuth);
applicationsRoute.openapi(createApplicationRoute, createApplication);
applicationsRoute.use('/', requireRole('personnel'));
applicationsRoute.openapi(listApplicationsRoute, listApplications);
applicationsRoute.use('/cursor', requireRole('personnel'));
applicationsRoute.openapi(listApplicationsCursorRoute, listApplicationsCursor);
applicationsRoute.use('/accept', requireRole('personnel'));
applicationsRoute.openapi(acceptApplicationsRoute, acceptApplications);
applicationsRoute.use('/:id/accept', requireRole('personnel'));
applicationsRoute.openapi(acceptApplicationRoute, acceptApplication);
applicationsRoute.use('/:id', requireRole('personnel'));
applicationsRoute.openapi(getApplicationRoute, getApplication);
applicationsRoute.openapi(deleteApplicationRoute, deleteApplication);
