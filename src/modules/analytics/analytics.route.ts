import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jsonBody, jsonOk } from '@/lib/openapi-helpers';
import { forbidden, unauthorized } from '@/lib/openapi-responses';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import { analyticsChat } from './analytics.handler';
import {
	AnalyticsChatRequestSchema,
	AnalyticsChatResponseSchema,
} from './analytics.schema';

export const analyticsChatRoute = createRoute({
	method: 'post',
	path: '/chat',
	tags: ['Analytics'],
	summary: 'Ask basic scholarship analytics questions (admin/personnel only)',
	request: {
		body: jsonBody(AnalyticsChatRequestSchema),
	},
	responses: {
		200: jsonOk(AnalyticsChatResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const analyticsRoute = new OpenAPIHono<AppEnv>();

analyticsRoute.use('/*', requireAuth, requireRole('personnel'));
analyticsRoute.openapi(analyticsChatRoute, analyticsChat);
