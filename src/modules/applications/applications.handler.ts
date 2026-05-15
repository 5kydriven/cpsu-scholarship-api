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
	const { parents, addresses, ...application } = c.req.valid('json');
	const service = getApplicationsService(c);
	const result = await service.create(
		application,
		parents,
		addresses,
	);

	return c.json(result, 201);
};
