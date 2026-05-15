import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { createApplicationsRepo } from '@/repositories/applications';
import { createApplicationsService } from '@/services/applications.service';
import type { AppEnv } from '@/types/app';
import type { createApplicationRoute } from './applications.route';
import { createParentsRepo } from '@/repositories/parents.repo';
import { createAddressesRepo } from '@/repositories/addresses.repo';

const getApplicationsService = (c: Context<AppEnv>) =>
	createApplicationsService(
		createApplicationsRepo(c.get('db')),
		createParentsRepo(c.get('db')),
		createAddressesRepo(c.get('db')),
	);

export const createApplication: RouteHandler<
	typeof createApplicationRoute,
	AppEnv
> = async (c) => {
	const body = await c.req.parseBody();
	const service = getApplicationsService(c);
	// const result = await service.create();

	return c.json(body, 201);
};
