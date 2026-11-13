import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { AppError } from '@/lib/errors';
import type { AnalyticsRepo } from '@/repositories/analytics.repo';
import type { CoursesRepo } from '@/repositories/courses.repo';
import type { ProgramOfferingsRepo } from '@/repositories/program_offerings.repo';
import type { ScholarshipProgramsRepo } from '@/repositories/scholarship_programs.repo';
import { createAnalyticsService } from '../src/services/analytics.service';
import type { AnalyticsServiceDependencies } from '../src/types/analytics';

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

const createCoursesRepo = (
	overrides: Partial<CoursesRepo> = {},
) =>
	({
		findByNameOrAbbreviation: async () => [],
		...overrides,
	}) as CoursesRepo;

const createScholarshipProgramsRepo = (
	overrides: Partial<ScholarshipProgramsRepo> = {},
) =>
	({
		findByName: async () => [],
		...overrides,
	}) as ScholarshipProgramsRepo;

const createProgramOfferingsRepo = (
	overrides: Partial<ProgramOfferingsRepo> = {},
) =>
	({
		findByLabel: async () => [],
		...overrides,
	}) as ProgramOfferingsRepo;

const createDeps = (
	overrides: Partial<AnalyticsServiceDependencies> = {},
): AnalyticsServiceDependencies => ({
	analyticsRepo: repo,
	coursesRepo: createCoursesRepo(),
	scholarshipProgramsRepo: createScholarshipProgramsRepo(),
	programOfferingsRepo: createProgramOfferingsRepo(),
	...overrides,
});

test('lists supported analytics metrics', () => {
	const service = createAnalyticsService(createDeps());
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
	const service = createAnalyticsService(createDeps());

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
	const service = createAnalyticsService(createDeps());

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
	const service = createAnalyticsService(createDeps());

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
	const service = createAnalyticsService(createDeps());

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
	const service = createAnalyticsService(createDeps({ ai }));

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
	const service = createAnalyticsService(createDeps({ ai }));

	const response = await service.chat({
		message: 'Show applications by status',
	});

	assert.equal(response.metric, 'applications_by_status');
	assert.equal(response.result?.type, 'breakdown');
});

test('returns unsupported chat response for unknown questions', async () => {
	const service = createAnalyticsService(createDeps());

	const response = await service.chat({
		message: 'What is the weather today?',
	});

	assert.equal(response.metric, null);
	assert.equal(response.result, null);
	assert.equal(response.unsupportedReason, 'unsupported_metric');
});

test('accepts optional chat history and generates a second AI response', async () => {
	const calls: unknown[] = [];
	const ai = {
		run: async (_model: string, options: unknown) => {
			calls.push(options);
			if (calls.length === 1) {
				return { response: JSON.stringify({ metric: 'total_students' }) };
			}

			return {
				response:
					'There are 10 students right now. Want me to break that down by course?',
			};
		},
	} as unknown as Ai;
	const service = createAnalyticsService(createDeps({ ai }));

	const response = await service.chat({
		message: 'What about now?',
		history: [
			{ role: 'user', content: 'How many students were there last year?' },
			{ role: 'assistant', content: 'There were 8 students last year.' },
		],
	});

	assert.equal(response.answer, 'There are 10 students right now. Want me to break that down by course?');
	assert.equal(calls.length, 2);
	const secondCall = calls[1] as {
		messages: { role: string; content: string }[];
	};
	assert.ok(
		secondCall.messages.some((message) =>
			message.content.includes('How many students were there last year?'),
		),
	);
	assert.match(
		secondCall.messages.at(-1)?.content ?? '',
		/\[Analytics data: Total students: 10 students\.\]/,
	);
});

test('falls back to deterministic answer when response generation fails', async () => {
	const ai = {
		run: async (_model: string, options: { response_format?: unknown }) => {
			if (options.response_format) {
				return { response: JSON.stringify({ metric: 'total_students' }) };
			}

			throw new Error('response generation unavailable');
		},
	} as unknown as Ai;
	const service = createAnalyticsService(createDeps({ ai }));

	const response = await service.chat({
		message: 'How many students are there?',
	});

	assert.equal(response.answer, 'Total students: 10 students.');
});

test('resolves classifier course names through the owning course repo', async () => {
	const courseId = 'd4e5f6a7-b8c9-4123-9efa-456789012345';
	let receivedCourseId: string | undefined;
	let lookupValue: string | undefined;
	repo = createRepo({
		countStudents: async (filters) => {
			receivedCourseId = filters?.courseId;
			return 12;
		},
	});
	const ai = {
		run: async (_model: string, options: { response_format?: unknown }) => {
			if (options.response_format) {
				return {
					response: JSON.stringify({
						metric: 'total_students',
						filters: { courseId: 'BSIT' },
					}),
				};
			}

			return { response: 'There are 12 BSIT students. Want a status breakdown?' };
		},
	} as unknown as Ai;
	const service = createAnalyticsService(
		createDeps({
			ai,
			coursesRepo: createCoursesRepo({
				findByNameOrAbbreviation: async (value) => {
					lookupValue = value;
					return [{ id: courseId }];
				},
			}),
		}),
	);

	const response = await service.chat({
		message: 'How many students are in BSIT?',
	});

	assert.equal(lookupValue, 'BSIT');
	assert.equal(receivedCourseId, courseId);
	assert.equal(response.metric, 'total_students');
});

test('returns ambiguous unsupported response for ambiguous name filters', async () => {
	const ai = {
		run: async (_model: string, options: { response_format?: unknown }) => {
			if (options.response_format) {
				return {
					response: JSON.stringify({
						metric: 'total_students',
						filters: { courseId: 'Engineering' },
					}),
				};
			}

			return {
				response:
					'I found more than one matching course. Try naming the exact course or abbreviation.',
			};
		},
	} as unknown as Ai;
	const service = createAnalyticsService(
		createDeps({
			ai,
			coursesRepo: createCoursesRepo({
				findByNameOrAbbreviation: async () => [
					{ id: 'd4e5f6a7-b8c9-4123-9efa-456789012345' },
					{ id: 'e4e5f6a7-b8c9-4123-9efa-456789012345' },
				],
			}),
		}),
	);

	const response = await service.chat({
		message: 'How many students are in Engineering?',
	});

	assert.equal(response.metric, null);
	assert.equal(response.unsupportedReason, 'ambiguous');
});

test('returns missing-filter unsupported response for unresolved name filters', async () => {
	const ai = {
		run: async (_model: string, options: { response_format?: unknown }) => {
			if (options.response_format) {
				return {
					response: JSON.stringify({
						metric: 'total_students',
						filters: { courseId: 'Unknown Course' },
					}),
				};
			}

			return {
				response:
					'I could not match that course yet. Want to try the exact abbreviation?',
			};
		},
	} as unknown as Ai;
	const service = createAnalyticsService(
		createDeps({
			ai,
			coursesRepo: createCoursesRepo({
				findByNameOrAbbreviation: async () => [],
			}),
		}),
	);

	const response = await service.chat({
		message: 'How many students are in Unknown Course?',
	});

	assert.equal(response.metric, null);
	assert.equal(response.unsupportedReason, 'missing_filter');
});
