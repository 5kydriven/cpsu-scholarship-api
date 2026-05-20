import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { AppError } from '@/lib/errors';
import type { AnalyticsRepo } from '@/repositories/analytics.repo';
import { createAnalyticsService } from '../src/services/analytics.service';

const originalConsoleLog = console.log;

before(() => {
	console.log = () => undefined;
});

after(() => {
	console.log = originalConsoleLog;
});

const createRepo = (overrides: Partial<AnalyticsRepo> = {}) =>
	({
		countStudents: async () => 10,
		countApprovedScholars: async () => 5,
		countRegisteredAllowlist: async () => 7,
		countApplications: async () => 3,
		breakdownApplicationsByStatus: async () => [
			{ key: 'pending', label: 'pending', value: 2 },
			{ key: 'approved', label: 'approved', value: 1 },
		],
		breakdownApplicationsByCourse: async () => [
			{ key: 'course-1', label: 'BSIT', value: 4 },
		],
		breakdownApplicationsByOffering: async () => [
			{ key: 'offering-1', label: 'CPSU 2025-2026', value: 6 },
		],
		breakdownApplicationsBySchoolYear: async () => [
			{ key: '2025-2026', label: '2025-2026', value: 6 },
		],
		seriesApplicationsOverTime: async () => [
			{ bucketStart: '2026-05-01', value: 4 },
		],
		listPredictionRuns: async () => [
			{
				runId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
				offeringId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
				generatedAt: '2026-05-20T08:45:00.000Z',
				suggestedCount: 25,
				criteriaSnapshot: {
					maxGwa: 2.5,
				},
			},
		],
		...overrides,
	}) as AnalyticsRepo;

let repo: AnalyticsRepo;

beforeEach(() => {
	repo = createRepo();
});

test('lists supported analytics metrics', () => {
	const service = createAnalyticsService(repo);
	const response = service.listMetrics();

	assert.ok(response.data.some((metric) => metric.id === 'total_students'));
	assert.ok(
		response.data.some((metric) => metric.id === 'applications_over_time'),
	);
	assert.ok(
		response.data.every((metric) => Array.isArray(metric.supportedFilters)),
	);
});

test('runs scalar metric queries with filters', async () => {
	let receivedCourseId: string | undefined;
	repo = createRepo({
		countStudents: async (filters) => {
			receivedCourseId = filters?.courseId;
			return 12;
		},
	});
	const service = createAnalyticsService(repo);

	const response = await service.query({
		metric: 'total_students',
		filters: {
			courseId: 'd4e5f6a7-b8c9-0123-defa-456789012345',
		},
	});

	assert.equal(response.result.type, 'scalar');
	assert.equal(response.result.value, 12);
	assert.equal(receivedCourseId, 'd4e5f6a7-b8c9-0123-defa-456789012345');
});

test('rejects unsupported filters for a metric', async () => {
	const service = createAnalyticsService(repo);

	await assert.rejects(
		() =>
			service.query({
				metric: 'registered_allowlist',
				filters: {
					courseId: 'd4e5f6a7-b8c9-0123-defa-456789012345',
				},
			}),
		(error) =>
			error instanceof AppError && error.details[0]?.field === 'filters.courseId',
	);
});

test('returns breakdown, series, and prediction result variants', async () => {
	const service = createAnalyticsService(repo);

	const breakdown = await service.query({ metric: 'applications_by_status' });
	const series = await service.query({
		metric: 'applications_over_time',
		bucket: 'month',
	});
	const prediction = await service.query({
		metric: 'eligibility_prediction_runs',
	});

	assert.equal(breakdown.result.type, 'breakdown');
	assert.equal(series.result.type, 'series');
	assert.equal(prediction.result.type, 'prediction');
	assert.equal(prediction.result.summary.runs, 1);
});

test('routes chat locally when AI is not configured', async () => {
	const service = createAnalyticsService(repo);

	const response = await service.chat({
		message: 'How many students are there?',
	});

	assert.equal(response.metric, 'total_students');
	assert.equal(response.result?.type, 'scalar');
	assert.equal(response.unsupportedReason, null);
});

test('falls back when AI throws', async () => {
	const ai = {
		run: async () => {
			throw new Error('binding unavailable');
		},
	} as unknown as Ai;
	const service = createAnalyticsService(repo, ai);

	const response = await service.chat({
		message: 'How many pending applications do we have?',
	});

	assert.equal(response.metric, 'pending_applications');
	assert.equal(response.result?.type, 'scalar');
});

test('falls back when AI returns malformed JSON', async () => {
	const ai = {
		run: async () => ({ response: '{not-json' }),
	} as unknown as Ai;
	const service = createAnalyticsService(repo, ai);

	const response = await service.chat({
		message: 'Show applications by status',
	});

	assert.equal(response.metric, 'applications_by_status');
	assert.equal(response.result?.type, 'breakdown');
});

test('returns unsupported chat response for unknown questions', async () => {
	const service = createAnalyticsService(repo);

	const response = await service.chat({
		message: 'What is the weather today?',
	});

	assert.equal(response.metric, null);
	assert.equal(response.result, null);
	assert.equal(response.unsupportedReason, 'unsupported_metric');
});
