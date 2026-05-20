import { createAnalyticsRepo } from '@/repositories/analytics.repo';
import { createAnalyticsService } from '@/services/analytics.service';
import type { AppEnv } from '@/types/app';
import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { analyticsChatRoute } from './analytics.route';

const getAnalyticsService = (c: Context<AppEnv>) =>
	createAnalyticsService(createAnalyticsRepo(c.get('db')), c.env.AI);

export const analyticsChat: RouteHandler<typeof analyticsChatRoute, AppEnv> =
	async (c) => {
		const body = c.req.valid('json');
		const service = getAnalyticsService(c);
		const response = await service.chat(body);

		return c.json(response, 200);
	};
