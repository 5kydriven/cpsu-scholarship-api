import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	deletedNoContent,
	jsonBody,
	jsonCreated,
	jsonOk,
} from '@/lib/openapi-helpers';
import { forbidden, notFound, unauthorized } from '@/lib/openapi-responses';
import { CursorQuerySchema } from '@/lib/pagination';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import {
	ProgramOfferingsOffsetQuerySchema,
	ProgramOfferingsOffsetResponseSchema,
	ProgramOfferingsCursorResponseSchema,
	ProgramOfferingParamsSchema,
	ProgramOfferingResponseSchema,
	CreateProgramOfferingSchema,
	UpdateProgramOfferingSchema,
} from './program_offerings.schema';
import {
	listProgramOfferings,
	listProgramOfferingsCursor,
	getProgramOffering,
	createProgramOffering,
	updateProgramOffering,
	deleteProgramOffering,
} from './program_offerings.handler';

export const listProgramOfferingsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Program Offerings'],
	summary: 'List program offerings (offset pagination)',
	request: { query: ProgramOfferingsOffsetQuerySchema },
	responses: {
		200: jsonOk(ProgramOfferingsOffsetResponseSchema),
	},
});

export const listProgramOfferingsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Program Offerings'],
	summary: 'List program offerings (cursor pagination)',
	request: { query: CursorQuerySchema },
	responses: {
		200: jsonOk(ProgramOfferingsCursorResponseSchema),
	},
});

export const getProgramOfferingRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Program Offerings'],
	summary: 'Get program offering by ID',
	request: { params: ProgramOfferingParamsSchema },
	responses: {
		200: jsonOk(ProgramOfferingResponseSchema),
		404: notFound,
	},
});

export const createProgramOfferingRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Program Offerings'],
	summary: 'Create a program offering (admin/personnel only)',
	request: {
		body: jsonBody(CreateProgramOfferingSchema),
	},
	responses: {
		201: jsonCreated(ProgramOfferingResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const updateProgramOfferingRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Program Offerings'],
	summary: 'Update a program offering (admin/personnel only)',
	request: {
		params: ProgramOfferingParamsSchema,
		body: jsonBody(UpdateProgramOfferingSchema),
	},
	responses: {
		200: jsonOk(ProgramOfferingResponseSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteProgramOfferingRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Program Offerings'],
	summary: 'Delete a program offering (admin/personnel only)',
	request: { params: ProgramOfferingParamsSchema },
	responses: {
		204: deletedNoContent,
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const programOfferingsRoute = new OpenAPIHono<AppEnv>();

programOfferingsRoute.openapi(listProgramOfferingsRoute, listProgramOfferings);
programOfferingsRoute.openapi(
	listProgramOfferingsCursorRoute,
	listProgramOfferingsCursor,
);
programOfferingsRoute.openapi(getProgramOfferingRoute, getProgramOffering);

programOfferingsRoute.use('/*', requireAuth, requireRole('personnel'));
programOfferingsRoute.openapi(
	createProgramOfferingRoute,
	createProgramOffering,
);
programOfferingsRoute.openapi(
	updateProgramOfferingRoute,
	updateProgramOffering,
);
programOfferingsRoute.openapi(
	deleteProgramOfferingRoute,
	deleteProgramOffering,
);
