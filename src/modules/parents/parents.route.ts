import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	deletedNoContent,
	jsonBody,
	jsonCreated,
	jsonOk,
} from '@/lib/openapi-helpers';
import { unauthorized, forbidden, notFound } from '@/lib/openapi-responses';
import { CursorQuerySchema } from '@/lib/pagination';
import { requireAuth } from '@/middleware/require-auth';
import type { AppEnv } from '@/types/app';
import {
	parentInsertSchema,
	ParentParamsSchema,
	ParentsCursorResponseSchema,
	parentSelectSchema,
	ParentsOffsetQuerySchema,
	ParentsOffsetResponseSchema,
	parentUpdateSchema,
} from './parents.schema';
import {
	createParent,
	deleteParent,
	getParent,
	listParents,
	listParentsCursor,
	updateParent,
} from './parents.handler';

export const listParentsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Parents'],
	summary: 'List parents (offset pagination)',
	request: { query: ParentsOffsetQuerySchema },
	responses: {
		200: jsonOk(ParentsOffsetResponseSchema),
	},
});

export const listParentsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Parents'],
	summary: 'List parents (cursor pagination)',
	request: { query: CursorQuerySchema },
	responses: {
		200: jsonOk(ParentsCursorResponseSchema),
	},
});

export const getParentRoute = createRoute({
	method: 'get',
	path: '/:id',
	tags: ['Parents'],
	summary: 'Get parent by id',
	request: { params: ParentParamsSchema },
	responses: {
		200: jsonOk(parentSelectSchema),
	},
});

export const createParentRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Parents'],
	summary: 'Create a new parent',
	request: {
		body: jsonBody(parentInsertSchema),
	},
	responses: {
		201: jsonCreated(parentSelectSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const updateParentRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Parents'],
	summary: 'Update a parent',
	request: {
		params: ParentParamsSchema,
		body: jsonBody(parentUpdateSchema),
	},
	responses: {
		200: jsonOk(parentSelectSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteParentRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Parents'],
	summary: 'Delete a parent',
	request: { params: ParentParamsSchema },
	responses: {
		204: deletedNoContent,
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const parentsRoute = new OpenAPIHono<AppEnv>();

parentsRoute.use('/*', requireAuth);
parentsRoute.openapi(createParentRoute, createParent);
parentsRoute.openapi(listParentsRoute, listParents);
parentsRoute.openapi(listParentsCursorRoute, listParentsCursor);
parentsRoute.openapi(getParentRoute, getParent);
parentsRoute.openapi(updateParentRoute, updateParent);
parentsRoute.openapi(deleteParentRoute, deleteParent);
