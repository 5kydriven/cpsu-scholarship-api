import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	jsonBody,
	jsonContent,
	jsonOk,
} from '@/lib/openapi-helpers';
import {
	deleted,
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
	createStaffProfile,
	deleteStaffProfile,
	getStaffProfile,
	listStaffProfiles,
	listStaffProfilesCursor,
	updateStaffProfile,
} from './staff_profiles.handler';
import {
	CreateStaffProfileSchema,
	StaffProfileParamsSchema,
	StaffProfileSchema,
	StaffProfilesCursorResponseSchema,
	StaffProfilesOffsetQuerySchema,
	StaffProfilesOffsetResponseSchema,
	UpdateStaffProfileSchema,
} from './staff_profiles.schema';

export const listStaffProfilesRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Personnels'],
	summary: 'List personnels (offset pagination)',
	request: { query: StaffProfilesOffsetQuerySchema },
	responses: {
		200: jsonOk(StaffProfilesOffsetResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const listStaffProfilesCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Personnels'],
	summary: 'List personnels (cursor pagination)',
	request: { query: CursorQuerySchema },
	responses: {
		200: jsonOk(StaffProfilesCursorResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const getStaffProfileRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Personnels'],
	summary: 'Get personnel by ID',
	request: { params: StaffProfileParamsSchema },
	responses: {
		200: jsonOk(StaffProfileSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
		422: validationError,
	},
});

export const createStaffProfileRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Personnels'],
	summary: 'Create a personnel account',
	request: {
		body: jsonBody(CreateStaffProfileSchema),
	},
	responses: {
		201: {
			description: 'Created personnel staff profile',
			content: jsonContent(StaffProfileSchema),
		},
		401: unauthorized,
		403: forbidden,
		422: validationError,
	},
});

export const updateStaffProfileRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Personnels'],
	summary: 'Update personnel by ID',
	request: {
		params: StaffProfileParamsSchema,
		body: jsonBody(UpdateStaffProfileSchema),
	},
	responses: {
		200: {
			description: 'Updated personnel profile',
			content: jsonContent(StaffProfileSchema),
		},
		401: unauthorized,
		403: forbidden,
		404: notFound,
		422: validationError,
	},
});

export const deleteStaffProfileRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Personnels'],
	summary: 'Delete personnel by ID',
	request: { params: StaffProfileParamsSchema },
	responses: {
		204: deleted,
		401: unauthorized,
		403: forbidden,
		404: notFound,
		422: validationError,
	},
});

export const staffProfilesRoute = new OpenAPIHono<AppEnv>();

staffProfilesRoute.use('/cursor', requireAuth, requireRole('admin'));
staffProfilesRoute.openapi(
	listStaffProfilesCursorRoute,
	listStaffProfilesCursor,
);

staffProfilesRoute.use('/', requireAuth, requireRole('admin'));
staffProfilesRoute.openapi(createStaffProfileRoute, createStaffProfile);
staffProfilesRoute.openapi(listStaffProfilesRoute, listStaffProfiles);

staffProfilesRoute.use('/:id', requireAuth, requireRole('personnel'));
staffProfilesRoute.openapi(getStaffProfileRoute, getStaffProfile);
staffProfilesRoute.openapi(updateStaffProfileRoute, updateStaffProfile);
staffProfilesRoute.openapi(deleteStaffProfileRoute, deleteStaffProfile);
