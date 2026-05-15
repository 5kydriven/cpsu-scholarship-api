import { createCursorPage, createOffsetPage } from '@/lib/pagination';
import { createApplicationsRepo } from '@/repositories/applications';
import { createEligibilitySuggestionsRepo } from '@/repositories/eligibility_suggestions.repo';
import { createProgramOfferingsRepo } from '@/repositories/program_offerings.repo';
import { createEligibilitySuggestionsService } from '@/services/eligibility_suggestions.service';
import { createProgramOfferingsService } from '@/services/program_offerings.service';
import { AppEnv } from '@/types/app';
import { RouteHandler } from '@hono/zod-openapi';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
	listProgramOfferingsRoute,
	listProgramOfferingsCursorRoute,
	getProgramOfferingRoute,
	createProgramOfferingRoute,
	updateProgramOfferingRoute,
	deleteProgramOfferingRoute,
	generateEligibilitySuggestionsRoute,
	getEligibilitySuggestionRunRoute,
	listEligibilitySuggestionRunsRoute,
} from './program_offerings.route';

const getProgramOfferingsService = (c: Context<AppEnv>) =>
	createProgramOfferingsService(createProgramOfferingsRepo(c.get('db')));

const getEligibilitySuggestionsService = (c: Context<AppEnv>) =>
	createEligibilitySuggestionsService(
		createProgramOfferingsRepo(c.get('db')),
		createApplicationsRepo(c.get('db')),
		createEligibilitySuggestionsRepo(c.get('db')),
	);

export const listProgramOfferings: RouteHandler<
	typeof listProgramOfferingsRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getProgramOfferingsService(c);
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

export const listProgramOfferingsCursor: RouteHandler<
	typeof listProgramOfferingsCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getProgramOfferingsService(c);
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

export const getProgramOffering: RouteHandler<
	typeof getProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getProgramOfferingsService(c);
	const programOffering = await service.getById(id);

	return c.json(programOffering, 200);
};

export const createProgramOffering: RouteHandler<
	typeof createProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const service = getProgramOfferingsService(c);
	const programOffering = await service.create(body);

	return c.json(programOffering, 201);
};

export const updateProgramOffering: RouteHandler<
	typeof updateProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const service = getProgramOfferingsService(c);
	const programOffering = await service.update(id, body);

	return c.json(programOffering, 200);
};

export const deleteProgramOffering: RouteHandler<
	typeof deleteProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getProgramOfferingsService(c);

	await service.softDelete(id);

	return c.body(null, 204);
};

export const generateEligibilitySuggestions: RouteHandler<
	typeof generateEligibilitySuggestionsRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const user = c.get('user');
	if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

	const service = getEligibilitySuggestionsService(c);
	const result = await service.generate(id, user);

	return c.json(result, 200);
};

export const listEligibilitySuggestionRuns: RouteHandler<
	typeof listEligibilitySuggestionRunsRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getEligibilitySuggestionsService(c);
	const result = await service.listRuns(id);

	return c.json(result, 200);
};

export const getEligibilitySuggestionRun: RouteHandler<
	typeof getEligibilitySuggestionRunRoute,
	AppEnv
> = async (c) => {
	const { id, runId } = c.req.valid('param');
	const service = getEligibilitySuggestionsService(c);
	const result = await service.getRun(id, runId);

	return c.json(result, 200);
};
