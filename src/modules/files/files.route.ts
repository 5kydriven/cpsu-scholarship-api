import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	forbidden,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';
import { requireAuth } from '@/middleware/require-auth';
import type { AppEnv } from '@/types/app';

import { createFile } from './files.handler';
import { FileResponseSchema, FileUploadSchema } from './files.schema';

export const createFileRoute = createRoute({
	method: 'post',
	path: '/upload',
	tags: ['Files'],
	summary: 'Upload a File',
	request: {
		body: {
			content: { 'multipart/form-data': { schema: FileUploadSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: { 'application/json': { schema: FileResponseSchema } },
			description: 'Created',
		},
		401: unauthorized,
		403: forbidden,
		422: validationError,
	},
});

export const filesRoute = new OpenAPIHono<AppEnv>();

filesRoute.use('/upload', requireAuth);
filesRoute.openapi(createFileRoute, createFile);
