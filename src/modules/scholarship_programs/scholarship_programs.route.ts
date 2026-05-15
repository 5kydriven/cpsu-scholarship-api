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
	ScholarshipProgramsOffsetQuerySchema,
	ScholarshipProgramsOffsetResponseSchema,
	ScholarshipProgramsCursorResponseSchema,
	ScholarshipProgramParamsSchema,
	ScholarshipProgramSelectSchema,
	ScholarshipProgramInsertSchema,
	ScholarshipProgramUpdateSchema,
} from './scholarship_programs.schema';
import {
	listScholarshipPrograms,
	listScholarshipProgramsCursor,
	getScholarshipProgram,
	createScholarshipProgram,
	updateScholarshipProgram,
	deleteScholarshipProgram,
} from './scholarship_programs.handler';

export const listScholarshipProgramsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Scholarship Programs'],
	summary: 'List scholarship programs (offset pagination)',
	request: { query: ScholarshipProgramsOffsetQuerySchema },
	responses: {
		200: jsonOk(ScholarshipProgramsOffsetResponseSchema),
	},
});

export const listScholarshipProgramsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Scholarship Programs'],
	summary: 'List scholarship programs (cursor pagination)',
	request: { query: CursorQuerySchema },
	responses: {
		200: jsonOk(ScholarshipProgramsCursorResponseSchema),
	},
});

export const getScholarshipProgramRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Scholarship Programs'],
	summary: 'Get scholarship program by ID',
	request: { params: ScholarshipProgramParamsSchema },
	responses: {
		200: jsonOk(ScholarshipProgramSelectSchema),
		404: notFound,
	},
});

export const createScholarshipProgramRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Scholarship Programs'],
	summary: 'Create a scholarship program (admin/personnel only)',
	request: {
		body: jsonBody(ScholarshipProgramInsertSchema),
	},
	responses: {
		201: jsonCreated(ScholarshipProgramSelectSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const updateScholarshipProgramRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Scholarship Programs'],
	summary: 'Update a scholarship program (admin/personnel only)',
	request: {
		params: ScholarshipProgramParamsSchema,
		body: jsonBody(ScholarshipProgramUpdateSchema),
	},
	responses: {
		200: jsonOk(ScholarshipProgramSelectSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteScholarshipProgramRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Scholarship Programs'],
	summary: 'Delete a scholarship program (admin/personnel only)',
	request: { params: ScholarshipProgramParamsSchema },
	responses: {
		204: deletedNoContent,
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const scholarshipProgramsRoute = new OpenAPIHono<AppEnv>();

scholarshipProgramsRoute.use('/*', requireAuth, requireRole('personnel'));
scholarshipProgramsRoute.openapi(
	listScholarshipProgramsRoute,
	listScholarshipPrograms,
);
scholarshipProgramsRoute.openapi(
	listScholarshipProgramsCursorRoute,
	listScholarshipProgramsCursor,
);
scholarshipProgramsRoute.openapi(
	getScholarshipProgramRoute,
	getScholarshipProgram,
);
scholarshipProgramsRoute.openapi(
	createScholarshipProgramRoute,
	createScholarshipProgram,
);
scholarshipProgramsRoute.openapi(
	updateScholarshipProgramRoute,
	updateScholarshipProgram,
);
scholarshipProgramsRoute.openapi(
	deleteScholarshipProgramRoute,
	deleteScholarshipProgram,
);
