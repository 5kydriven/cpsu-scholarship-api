import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import {
	forbidden,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';
import {
	StudentAllowlistImportBodySchema,
	StudentAllowlistImportResponseSchema,
	StudentAllowlistVerifyQuerySchema,
	StudentAllowlistVerifyResponseSchema,
	StudentAllowlistsCursorQuerySchema,
	StudentAllowlistsCursorResponseSchema,
	StudentAllowlistsOffsetQuerySchema,
	StudentAllowlistsOffsetResponseSchema,
} from './student_allowlists.schema';
import { AppEnv } from '@/types/app';
import {
	importStudentAllowlists,
	listStudentAllowlists,
	listStudentAllowlistsCursor,
} from './student_allowlists.handler';

export const listStudentAllowlistsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Student Allowlists'],
	summary: 'List student allowlists (offset pagination)',
	request: { query: StudentAllowlistsOffsetQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: StudentAllowlistsOffsetResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const listStudentAllowlistsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Student Allowlists'],
	summary: 'List student allowlists (cursor pagination)',
	request: { query: StudentAllowlistsCursorQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: StudentAllowlistsCursorResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const importStudentAllowlistsRoute = createRoute({
	method: 'post',
	path: '/import',
	tags: ['Student Allowlists'],
	summary: 'Import student allowlist rows from CSV or Excel',
	request: {
		body: {
			content: {
				'multipart/form-data': {
					schema: StudentAllowlistImportBodySchema,
				},
			},
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				'application/json': { schema: StudentAllowlistImportResponseSchema },
			},
			description: 'Imported',
		},
		401: unauthorized,
		403: forbidden,
		422: validationError,
	},
});

export const studentAllowlistsRoute = new OpenAPIHono<AppEnv>();

studentAllowlistsRoute.use('/*', requireAuth, requireRole('personnel'));
studentAllowlistsRoute.openapi(
	listStudentAllowlistsRoute,
	listStudentAllowlists,
);
studentAllowlistsRoute.openapi(
	listStudentAllowlistsCursorRoute,
	listStudentAllowlistsCursor,
);
studentAllowlistsRoute.openapi(
	importStudentAllowlistsRoute,
	importStudentAllowlists,
);
