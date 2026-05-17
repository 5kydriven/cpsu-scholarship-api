import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { jsonBody, jsonOk } from '@/lib/openapi-helpers';
import {
	conflict,
	forbidden,
	notFound,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import {
	getPayout,
	listMyPayouts,
	openPayoutClaims,
	releasePayout,
} from './payouts.handler';
import {
	OpenPayoutClaimsBodySchema,
	PayoutCheckReleaseSchema,
	PayoutParamsSchema,
	PayoutResponseSchema,
	PayoutsResponseSchema,
} from './payouts.schema';

export const getPayoutRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Payouts'],
	summary: 'Get payout by ID (admin/personnel only)',
	request: { params: PayoutParamsSchema },
	responses: {
		200: jsonOk(PayoutResponseSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const listMyPayoutsRoute = createRoute({
	method: 'get',
	path: '/me',
	tags: ['Payouts'],
	summary: 'List payouts for the authenticated student',
	responses: {
		200: jsonOk(PayoutsResponseSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const openPayoutClaimsRoute = createRoute({
	method: 'post',
	path: '/claimable',
	tags: ['Payouts'],
	summary: 'Open selected pending payouts for student claiming',
	request: {
		body: jsonBody(OpenPayoutClaimsBodySchema),
	},
	responses: {
		200: jsonOk(PayoutsResponseSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
		409: conflict,
		422: validationError,
	},
});

export const releasePayoutRoute = createRoute({
	method: 'post',
	path: '/{id}/release',
	tags: ['Payouts'],
	summary: 'Submit check proof and release a pending payout (student only)',
	request: {
		params: PayoutParamsSchema,
		body: {
			content: {
				'multipart/form-data': { schema: PayoutCheckReleaseSchema },
			},
			required: true,
		},
	},
	responses: {
		200: jsonOk(PayoutResponseSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
		409: conflict,
	},
});

export const payoutsRoute = new OpenAPIHono<AppEnv>();

payoutsRoute.use('/*', requireAuth);
payoutsRoute.openapi(listMyPayoutsRoute, listMyPayouts);
payoutsRoute.openapi(releasePayoutRoute, releasePayout);
payoutsRoute.use('/claimable', requireRole('personnel'));
payoutsRoute.openapi(openPayoutClaimsRoute, openPayoutClaims);
payoutsRoute.use('/:id', requireRole('personnel'));
payoutsRoute.openapi(getPayoutRoute, getPayout);
