import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jsonBody, jsonOk } from '@/lib/openapi-helpers';
import { forbidden, unauthorized } from '@/lib/openapi-responses';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import {
	analyticsChat,
	listAnalyticsMetrics,
	queryAnalytics,
} from './analytics.handler';
import {
	AnalyticsChatRequestSchema,
	AnalyticsChatResponseSchema,
	AnalyticsMetricsResponseSchema,
	AnalyticsQueryRequestSchema,
	AnalyticsQueryResponseSchema,
} from './analytics.schema';

export const listAnalyticsMetricsRoute = createRoute({
	method: 'get',
	path: '/metrics',
	tags: ['Analytics'],
	summary: 'List supported analytics metrics and tools (admin/personnel only)',
	responses: {
		200: jsonOk(AnalyticsMetricsResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const queryAnalyticsRoute = createRoute({
	method: 'post',
	path: '/query',
	tags: ['Analytics'],
	summary: 'Run a typed analytics metric query (admin/personnel only)',
	request: {
		body: jsonBody(AnalyticsQueryRequestSchema),
	},
	responses: {
		200: jsonOk(AnalyticsQueryResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const analyticsChatRoute = createRoute({
	method: 'post',
	path: '/chat',
	tags: ['Analytics'],
	summary: 'Ask scholarship analytics questions (admin/personnel only)',
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
analyticsRoute.openapi(listAnalyticsMetricsRoute, listAnalyticsMetrics);
analyticsRoute.openapi(queryAnalyticsRoute, queryAnalytics);
analyticsRoute.openapi(analyticsChatRoute, analyticsChat);
