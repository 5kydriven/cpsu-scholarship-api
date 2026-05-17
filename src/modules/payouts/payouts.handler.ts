import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { createPayoutsRepo } from '@/repositories/payouts.repo';
import { createStaffProfilesRepo } from '@/repositories/staff_profiles.repo';
import { createStudentsRepo } from '@/repositories/students.repo';
import { Errors } from '@/lib/errors';
import { createPayoutsService } from '@/services/payouts.service';
import type { AppEnv } from '@/types/app';
import { imageValidator } from '@/utils/file_validator';
import type {
	getPayoutRoute,
	listMyPayoutsRoute,
	openPayoutClaimsRoute,
	releasePayoutRoute,
} from './payouts.route';

const getPayoutsService = (c: Context<AppEnv>) =>
	createPayoutsService(
		createPayoutsRepo(c.get('db')),
		createStudentsRepo(c.get('db')),
		createStaffProfilesRepo(c.get('db')),
	);

export const getPayout: RouteHandler<typeof getPayoutRoute, AppEnv> = async (
	c,
) => {
	const { id } = c.req.valid('param');
	const service = getPayoutsService(c);
	const result = await service.getById(id);

	return c.json(result, 200);
};

export const listMyPayouts: RouteHandler<
	typeof listMyPayoutsRoute,
	AppEnv
> = async (c) => {
	const service = getPayoutsService(c);
	const result = await service.listMine(c.get('user')?.id ?? '');

	return c.json(result, 200);
};

export const openPayoutClaims: RouteHandler<
	typeof openPayoutClaimsRoute,
	AppEnv
> = async (c) => {
	const { ids } = c.req.valid('json');
	const service = getPayoutsService(c);
	const result = await service.openClaims(ids, c.get('user')?.id ?? '');

	return c.json(result, 200);
};

export const releasePayout: RouteHandler<
	typeof releasePayoutRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = await c.req.parseBody();
	const checkNo = String(body.checkNo ?? '').trim();
	if (!checkNo) {
		throw Errors.validation([
			{ field: 'checkNo', message: 'Check number is required' },
		]);
	}
	if (checkNo.length > 100) {
		throw Errors.validation([
			{ field: 'checkNo', message: 'Check number must be 100 characters or fewer' },
		]);
	}

	const uploadedImage = imageValidator(body.file);
	const key = `payouts/${id}/${crypto.randomUUID()}-${uploadedImage.name}`;

	await c.env.R2.put(key, uploadedImage.stream(), {
		httpMetadata: {
			contentType: uploadedImage.type,
		},
	});

	const service = getPayoutsService(c);
	const result = await service.submitCheckAndRelease({
		id,
		userId: c.get('user')?.id ?? '',
		checkNo,
		checkImageUrl: `${c.env.PUBLIC_URL}/${key}`,
	});

	return c.json(result, 200);
};
