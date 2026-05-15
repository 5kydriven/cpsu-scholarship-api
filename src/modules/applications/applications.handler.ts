import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { createCursorPage, createOffsetPage } from '@/lib/pagination';
import { createApplicationsRepo } from '@/repositories/applications';
import { createAddressesRepo } from '@/repositories/addresses.repo';
import { createParentsRepo } from '@/repositories/parents.repo';
import { createStudentsRepo } from '@/repositories/students.repo';
import { createApplicationsService } from '@/services/applications.service';
import type { AppEnv } from '@/types/app';
import type {
	acceptApplicationRoute,
	acceptApplicationsRoute,
	createApplicationRoute,
	deleteApplicationRoute,
	getApplicationRoute,
	listApplicationsCursorRoute,
	listApplicationsRoute,
} from './applications.route';

const getApplicationsService = (c: Context<AppEnv>) =>
	createApplicationsService(
		createApplicationsRepo(c.get('db')),
		createParentsRepo(c.get('db')),
		createAddressesRepo(c.get('db')),
		createStudentsRepo(c.get('db')),
	);

export const createApplication: RouteHandler<
	typeof createApplicationRoute,
	AppEnv
> = async (c) => {
	const { parents, addresses, ...application } = c.req.valid('json');
	const service = getApplicationsService(c);
	const result = await service.create(application, parents, addresses);

	return c.json(result, 201);
};

export const listApplications: RouteHandler<
	typeof listApplicationsRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getApplicationsService(c);
	const { rows, total } = await service.listOffset({
		page,
		perPage,
		search,
		sortField: sort,
		sortOrder: order,
	});

	return c.json(
		createOffsetPage({ rows, total, page, perPage }),
		200,
	);
};

export const listApplicationsCursor: RouteHandler<
	typeof listApplicationsCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getApplicationsService(c);
	const { rows, nextCursor, prevCursor, hasNext, hasPrev } =
		await service.listCursor({
			cursor: cursor ?? null,
			perPage,
			direction,
		});

	return c.json(
		createCursorPage(rows, {
			nextCursor,
			prevCursor,
			hasNext,
			hasPrev,
			perPage,
		}),
		200,
	);
};

export const getApplication: RouteHandler<
	typeof getApplicationRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getApplicationsService(c);
	const result = await service.getById(id);

	return c.json(result, 200);
};

export const acceptApplication: RouteHandler<
	typeof acceptApplicationRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getApplicationsService(c);
	const result = await service.accept(id, c.get('user')?.id ?? '');

	return c.json(result, 200);
};

export const deleteApplication: RouteHandler<
	typeof deleteApplicationRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getApplicationsService(c);

	await service.delete(id);

	return c.body(null, 204);
};

export const acceptApplications: RouteHandler<
	typeof acceptApplicationsRoute,
	AppEnv
> = async (c) => {
	const { ids } = c.req.valid('json');
	const service = getApplicationsService(c);
	const result = await service.acceptMany(ids, c.get('user')?.id ?? '');

	return c.json(result, 200);
};
