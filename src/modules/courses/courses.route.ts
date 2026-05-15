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
	createCourse,
	deleteCourse,
	getCourse,
	listCourses,
	listCoursesCursor,
	updateCourse,
} from './courses.handler';
import {
	courseInsertSchema,
	CourseParamsSchema,
	CoursesCursorResponseSchema,
	courseSelectSchema,
	CoursesOffsetQuerySchema,
	CoursesOffsetResponseSchema,
	courseUpdateSchema,
} from './courses.schema';

export const listCoursesRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Courses'],
	summary: 'List courses (offset pagination)',
	request: { query: CoursesOffsetQuerySchema },
	responses: {
		200: jsonOk(CoursesOffsetResponseSchema),
	},
});

export const listCoursesCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Courses'],
	summary: 'List courses (cursor pagination)',
	request: { query: CursorQuerySchema },
	responses: {
		200: jsonOk(CoursesCursorResponseSchema),
	},
});

export const getCourseRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Courses'],
	summary: 'Get course by ID',
	request: { params: CourseParamsSchema },
	responses: {
		200: jsonOk(courseSelectSchema),
		404: notFound,
	},
});

export const createCourseRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Courses'],
	summary: 'Create a course (admin/personnel only)',
	request: {
		body: jsonBody(courseInsertSchema),
	},
	responses: {
		201: jsonCreated(courseSelectSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const updateCourseRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Courses'],
	summary: 'Update a course (admin/personnel only)',
	request: {
		params: CourseParamsSchema,
		body: jsonBody(courseUpdateSchema),
	},
	responses: {
		200: jsonOk(courseSelectSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteCourseRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Courses'],
	summary: 'Delete a course (admin/personnel only)',
	request: { params: CourseParamsSchema },
	responses: {
		204: deletedNoContent,
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const coursesRoute = new OpenAPIHono<AppEnv>();

// Public routes
coursesRoute.openapi(listCoursesRoute, listCourses);
coursesRoute.openapi(listCoursesCursorRoute, listCoursesCursor);
coursesRoute.openapi(getCourseRoute, getCourse);

// Protected routes
coursesRoute.use('/*', requireAuth, requireRole('personnel'));
coursesRoute.openapi(createCourseRoute, createCourse);
coursesRoute.openapi(updateCourseRoute, updateCourse);
coursesRoute.openapi(deleteCourseRoute, deleteCourse);
