import { Errors } from '@/lib/errors';
import type {
	AnalyticsChatRequest,
	AnalyticsChatResponse,
	AnalyticsFilterKey,
	AnalyticsFilters,
	AnalyticsGroupBy,
	AnalyticsMetric,
	AnalyticsMetricDefinition,
	AnalyticsQueryRequest,
	AnalyticsQueryResponse,
	AnalyticsResult,
	AnalyticsResultType,
	AnalyticsTimeBucket,
} from '@/modules/analytics/analytics.schema';
import {
	AnalyticsFiltersSchema,
	AnalyticsGroupBySchema,
	AnalyticsMetricSchema,
	AnalyticsTimeBucketSchema,
} from '@/modules/analytics/analytics.schema';
import type { AnalyticsRepo } from '@/repositories/analytics.repo';

const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

type UnsupportedReason = 'unsupported_metric' | 'missing_filter' | 'ambiguous';

type AnalyticsClassification = {
	metric: AnalyticsMetric | 'unsupported';
	filters?: AnalyticsFilters;
	groupBy?: AnalyticsGroupBy;
	bucket?: AnalyticsTimeBucket;
	unsupportedReason?: UnsupportedReason;
};

type ClassificationResult = AnalyticsClassification & {
	source: 'ai' | 'local' | 'fallback';
};

type MetricResolver = (
	repo: AnalyticsRepo,
	request: AnalyticsQueryRequest,
) => Promise<AnalyticsResult>;

type MetricDefinition = AnalyticsMetricDefinition & {
	resolve: MetricResolver;
	format: (result: AnalyticsResult) => string;
};

const classificationSchema = {
	type: 'object',
	properties: {
		metric: {
			type: 'string',
			enum: [...AnalyticsMetricSchema.options, 'unsupported'],
		},
		filters: {
			type: 'object',
			properties: {
				offeringId: { type: 'string' },
				programId: { type: 'string' },
				courseId: { type: 'string' },
				schoolYear: { type: 'string' },
				status: {
					type: 'string',
					enum: ['pending', 'under_review', 'approved', 'rejected'],
				},
				from: { type: 'string' },
				to: { type: 'string' },
			},
			additionalProperties: false,
		},
		groupBy: {
			type: 'string',
			enum: ['status', 'course', 'offering', 'schoolYear'],
		},
		bucket: {
			type: 'string',
			enum: ['day', 'month', 'year'],
		},
		unsupportedReason: {
			type: 'string',
			enum: ['unsupported_metric', 'missing_filter', 'ambiguous'],
		},
	},
	required: ['metric'],
	additionalProperties: false,
};

const metricDefinitions: MetricDefinition[] = [
	{
		id: 'total_students',
		label: 'Total students',
		description: 'Counts registered student profiles.',
		resultType: 'scalar',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: ['courseId', 'from', 'to'],
		supportedGroupBy: [],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => scalarResult({
			label: 'Total students',
			unit: 'students',
			value: await repo.countStudents(request.filters ?? {}),
		}),
		format: formatScalar,
	},
	{
		id: 'approved_scholars',
		label: 'Approved scholars',
		description: 'Counts students currently marked as scholars.',
		resultType: 'scalar',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: ['courseId', 'from', 'to'],
		supportedGroupBy: [],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => scalarResult({
			label: 'Approved scholars',
			unit: 'students',
			value: await repo.countApprovedScholars(request.filters ?? {}),
		}),
		format: formatScalar,
	},
	{
		id: 'pending_applications',
		label: 'Pending applications',
		description: 'Counts applications with pending status.',
		resultType: 'scalar',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'from',
			'to',
		],
		supportedGroupBy: [],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => scalarResult({
			label: 'Pending applications',
			unit: 'applications',
			value: await repo.countApplications({
				...(request.filters ?? {}),
				status: 'pending',
			}),
		}),
		format: formatScalar,
	},
	{
		id: 'approved_applications',
		label: 'Approved applications',
		description: 'Counts applications with approved status.',
		resultType: 'scalar',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'from',
			'to',
		],
		supportedGroupBy: [],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => scalarResult({
			label: 'Approved applications',
			unit: 'applications',
			value: await repo.countApplications({
				...(request.filters ?? {}),
				status: 'approved',
			}),
		}),
		format: formatScalar,
	},
	{
		id: 'registered_allowlist',
		label: 'Registered allowlist students',
		description: 'Counts allowlisted students that have completed registration.',
		resultType: 'scalar',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: ['from', 'to'],
		supportedGroupBy: [],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => scalarResult({
			label: 'Registered allowlist students',
			unit: 'students',
			value: await repo.countRegisteredAllowlist(request.filters ?? {}),
		}),
		format: formatScalar,
	},
	{
		id: 'applications_by_status',
		label: 'Applications by status',
		description: 'Breaks application counts down by workflow status.',
		resultType: 'breakdown',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'from',
			'to',
		],
		supportedGroupBy: ['status'],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => ({
			type: 'breakdown',
			label: 'Applications by status',
			dimension: 'status',
			items: await repo.breakdownApplicationsByStatus(request.filters ?? {}),
		}),
		format: formatBreakdown,
	},
	{
		id: 'applications_by_course',
		label: 'Applications by course',
		description: 'Breaks application counts down by course.',
		resultType: 'breakdown',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'status',
			'from',
			'to',
		],
		supportedGroupBy: ['course'],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => ({
			type: 'breakdown',
			label: 'Applications by course',
			dimension: 'course',
			items: await repo.breakdownApplicationsByCourse(request.filters ?? {}),
		}),
		format: formatBreakdown,
	},
	{
		id: 'applications_by_offering',
		label: 'Applications by offering',
		description: 'Breaks application counts down by program offering.',
		resultType: 'breakdown',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'status',
			'from',
			'to',
		],
		supportedGroupBy: ['offering'],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => ({
			type: 'breakdown',
			label: 'Applications by offering',
			dimension: 'offering',
			items: await repo.breakdownApplicationsByOffering(request.filters ?? {}),
		}),
		format: formatBreakdown,
	},
	{
		id: 'applications_by_school_year',
		label: 'Applications by school year',
		description: 'Breaks application counts down by offering school year.',
		resultType: 'breakdown',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'status',
			'from',
			'to',
		],
		supportedGroupBy: ['schoolYear'],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => ({
			type: 'breakdown',
			label: 'Applications by school year',
			dimension: 'schoolYear',
			items: await repo.breakdownApplicationsBySchoolYear(request.filters ?? {}),
		}),
		format: formatBreakdown,
	},
	{
		id: 'applications_over_time',
		label: 'Applications over time',
		description: 'Returns application volume by day, month, or year.',
		resultType: 'series',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'status',
			'from',
			'to',
		],
		supportedGroupBy: [],
		supportedBuckets: ['day', 'month', 'year'],
		chatEnabled: true,
		resolve: async (repo, request) => {
			const bucket = request.bucket ?? 'month';

			return {
				type: 'series',
				label: 'Applications over time',
				bucket,
				points: await repo.seriesApplicationsOverTime(
					request.filters ?? {},
					bucket,
				),
			};
		},
		format: formatSeries,
	},
	{
		id: 'eligibility_prediction_runs',
		label: 'Eligibility prediction runs',
		description: 'Summarizes saved eligibility suggestion prediction runs.',
		resultType: 'prediction',
		allowedRoles: ['personnel', 'admin'],
		supportedFilters: ['offeringId', 'from', 'to'],
		supportedGroupBy: [],
		supportedBuckets: [],
		chatEnabled: true,
		resolve: async (repo, request) => {
			const records = await repo.listPredictionRuns(request.filters ?? {});

			return {
				type: 'prediction',
				label: 'Eligibility prediction runs',
				summary: {
					runs: records.length,
					latestGeneratedAt: records[0]?.generatedAt ?? null,
					modelVersion: null,
					confidence: null,
				},
				records,
			};
		},
		format: formatPrediction,
	},
];

const metricsById = new Map(metricDefinitions.map((metric) => [metric.id, metric]));

export const createAnalyticsService = (
	analyticsRepo: AnalyticsRepo,
	ai?: Ai,
) => {
	const query = async (
		request: AnalyticsQueryRequest,
	): Promise<AnalyticsQueryResponse> => {
		const generatedAt = new Date().toISOString();
		const start = performance.now();
		const definition = getMetricDefinition(request.metric);
		const filters = request.filters ?? {};

		validateSupportedOptions(definition, request);

		const dbStart = performance.now();
		const result = await definition.resolve(analyticsRepo, {
			...request,
			filters,
		});
		const dbDurationMs = Math.round(performance.now() - dbStart);

		logAnalyticsEvent('analytics_query', {
			metric: request.metric,
			filters,
			resultType: result.type,
			dbDurationMs,
			totalDurationMs: Math.round(performance.now() - start),
		});

		return {
			answer: definition.format(result),
			metric: request.metric,
			result,
			filters,
			generatedAt,
		};
	};

	return {
		listMetrics() {
			return {
				data: metricDefinitions.map(toPublicMetricDefinition),
			};
		},

		query,

		async chat(request: AnalyticsChatRequest): Promise<AnalyticsChatResponse> {
		const generatedAt = new Date().toISOString();
		const start = performance.now();
		const classification = await classifyMetric(ai, request);

		if (classification.metric === 'unsupported') {
			logAnalyticsEvent('analytics_chat_unsupported', {
				classificationSource: classification.source,
				unsupportedReason:
					classification.unsupportedReason ?? 'unsupported_metric',
				totalDurationMs: Math.round(performance.now() - start),
			});

			return {
				answer:
					'I can answer typed scholarship analytics such as counts, breakdowns, trends, and eligibility prediction run summaries.',
				metric: null,
				result: null,
				filters: {},
				generatedAt,
				unsupportedReason:
					classification.unsupportedReason ?? 'unsupported_metric',
			};
		}

		const response = await query({
			metric: classification.metric,
			filters: classification.filters ?? {},
			groupBy: classification.groupBy,
			bucket: classification.bucket,
		});

		logAnalyticsEvent('analytics_chat_routed', {
			metric: classification.metric,
			filters: response.filters,
			resultType: response.result.type,
			classificationSource: classification.source,
			aiModel: ai ? model : null,
			totalDurationMs: Math.round(performance.now() - start),
		});

		return {
			...response,
			unsupportedReason: null,
		};
		},
	};
};

const scalarResult = (input: {
	label: string;
	value: number;
	unit: string;
}): AnalyticsResult => ({
	type: 'scalar',
	...input,
});

const getMetricDefinition = (metric: AnalyticsMetric) => {
	const definition = metricsById.get(metric);
	if (!definition) {
		throw Errors.validation([
			{ field: 'metric', message: `Unsupported analytics metric: ${metric}` },
		]);
	}

	return definition;
};

const validateSupportedOptions = (
	definition: MetricDefinition,
	request: AnalyticsQueryRequest,
) => {
	const filters = request.filters ?? {};
	const unsupportedFilters = Object.entries(filters)
		.filter(([, value]) => value !== undefined)
		.map(([key]) => key as AnalyticsFilterKey)
		.filter((key) => !definition.supportedFilters.includes(key));

	if (unsupportedFilters.length > 0) {
		throw Errors.validation(
			unsupportedFilters.map((field) => ({
				field: `filters.${field}`,
				message: `${field} is not supported by ${definition.id}`,
			})),
		);
	}

	if (
		request.groupBy &&
		!definition.supportedGroupBy.includes(request.groupBy)
	) {
		throw Errors.validation([
			{
				field: 'groupBy',
				message: `${request.groupBy} is not supported by ${definition.id}`,
			},
		]);
	}

	if (request.bucket && !definition.supportedBuckets.includes(request.bucket)) {
		throw Errors.validation([
			{
				field: 'bucket',
				message: `${request.bucket} is not supported by ${definition.id}`,
			},
		]);
	}
};

const toPublicMetricDefinition = (
	definition: MetricDefinition,
): AnalyticsMetricDefinition => ({
	id: definition.id,
	label: definition.label,
	description: definition.description,
	resultType: definition.resultType as AnalyticsResultType,
	allowedRoles: definition.allowedRoles,
	supportedFilters: definition.supportedFilters,
	supportedGroupBy: definition.supportedGroupBy,
	supportedBuckets: definition.supportedBuckets,
	chatEnabled: definition.chatEnabled,
});

const classifyMetric = async (
	ai: Ai | undefined,
	request: AnalyticsChatRequest,
): Promise<ClassificationResult> => {
	if (!ai) {
		return { ...classifyMetricLocally(request), source: 'fallback' };
	}

	const startedAt = performance.now();
	const aiClassification = await classifyMetricWithAi(ai, request).catch(
		(error) => {
			logAnalyticsEvent('ai_classification_failed', {
				aiModel: model,
				message: error instanceof Error ? error.message : 'Unknown AI error',
				durationMs: Math.round(performance.now() - startedAt),
			});

			return null;
		},
	);

	return aiClassification
		? { ...aiClassification, source: 'ai' }
		: { ...classifyMetricLocally(request), source: 'local' };
};

const classifyMetricWithAi = async (
	ai: Ai,
	request: AnalyticsChatRequest,
): Promise<AnalyticsClassification | null> => {
	const response = await ai.run(model, {
		messages: [
			{
				role: 'system',
				content: [
					'Classify the user question into one analytics metric.',
					'Prefer scalar count metrics for direct total questions.',
					'Use breakdown metrics for questions asking by status, course, offering, program, or school year.',
					'Use applications_over_time for trends, history, by month, by day, or over time.',
					'Use eligibility_prediction_runs only for saved eligibility suggestion or prediction run summaries.',
					'Return unsupported for questions outside scholarship analytics.',
					'Never produce SQL, table names, column names, or calculations.',
				].join(' '),
			},
			{
				role: 'user',
				content: JSON.stringify({ message: request.message }),
			},
		],
		temperature: 0,
		max_tokens: 256,
		response_format: {
			type: 'json_schema',
			json_schema: classificationSchema,
		},
	});
	const parsed = parseAiResponse(response);

	if (!parsed || !isClassification(parsed)) return null;

	return parsed;
};

const parseAiResponse = (response: unknown): unknown => {
	if (typeof response === 'string') return parseJson(response);

	if (!response || typeof response !== 'object') return null;

	if ('response' in response) {
		const content = response.response;
		return typeof content === 'string' ? parseJson(content) : content;
	}

	return response;
};

const parseJson = (value: string) => {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

const isClassification = (value: unknown): value is AnalyticsClassification => {
	if (!value || typeof value !== 'object') return false;
	if (!('metric' in value) || typeof value.metric !== 'string') return false;

	if (
		value.metric !== 'unsupported' &&
		!AnalyticsMetricSchema.safeParse(value.metric).success
	) {
		return false;
	}

	if (
		'filters' in value &&
		value.filters !== undefined &&
		!AnalyticsFiltersSchema.safeParse(value.filters).success
	) {
		return false;
	}

	if (
		'groupBy' in value &&
		value.groupBy !== undefined &&
		!AnalyticsGroupBySchema.safeParse(value.groupBy).success
	) {
		return false;
	}

	if (
		'bucket' in value &&
		value.bucket !== undefined &&
		!AnalyticsTimeBucketSchema.safeParse(value.bucket).success
	) {
		return false;
	}

	return true;
};

const classifyMetricLocally = (
	request: AnalyticsChatRequest,
): AnalyticsClassification => {
	const message = request.message.toLowerCase();

	if (/\b(prediction|predictions|suggestion|suggestions|eligibility runs?)\b/.test(message)) {
		return { metric: 'eligibility_prediction_runs' };
	}

	if (/\b(over time|trend|trends|monthly|daily|yearly|by month|by day|by year)\b/.test(message)) {
		return {
			metric: 'applications_over_time',
			bucket: /\b(day|daily|by day)\b/.test(message)
				? 'day'
				: /\b(year|yearly|by year)\b/.test(message)
					? 'year'
					: 'month',
		};
	}

	if (/\bby status\b/.test(message)) {
		return { metric: 'applications_by_status', groupBy: 'status' };
	}

	if (/\bby course\b/.test(message)) {
		return { metric: 'applications_by_course', groupBy: 'course' };
	}

	if (/\bby offering|by program\b/.test(message)) {
		return { metric: 'applications_by_offering', groupBy: 'offering' };
	}

	if (/\bschool year|by year\b/.test(message)) {
		return { metric: 'applications_by_school_year', groupBy: 'schoolYear' };
	}

	if (/\b(allowlist|allowlisted|registered)\b/.test(message)) {
		return { metric: 'registered_allowlist' };
	}

	if (/\b(pending)\b/.test(message) && /\b(application|applications)\b/.test(message)) {
		return { metric: 'pending_applications' };
	}

	if (
		/\b(approved|accepted)\b/.test(message) &&
		/\b(application|applications)\b/.test(message)
	) {
		return { metric: 'approved_applications' };
	}

	if (
		/\b(approved|eligible|scholar|scholars)\b/.test(message) &&
		/\b(student|students|scholar|scholars)\b/.test(message)
	) {
		return { metric: 'approved_scholars' };
	}

	if (/\b(student|students)\b/.test(message)) {
		return { metric: 'total_students' };
	}

	return { metric: 'unsupported', unsupportedReason: 'unsupported_metric' };
};

function formatScalar(result: AnalyticsResult) {
	if (result.type !== 'scalar') return 'The metric was calculated.';

	const formattedValue = new Intl.NumberFormat('en').format(result.value);
	return `${result.label}: ${formattedValue} ${result.unit}.`;
}

function formatBreakdown(result: AnalyticsResult) {
	if (result.type !== 'breakdown') return 'The breakdown was calculated.';
	if (result.items.length === 0) return `${result.label}: no matching data.`;

	const total = result.items.reduce((sum, item) => sum + item.value, 0);
	const formattedTotal = new Intl.NumberFormat('en').format(total);
	return `${result.label}: ${formattedTotal} total across ${result.items.length} groups.`;
}

function formatSeries(result: AnalyticsResult) {
	if (result.type !== 'series') return 'The time series was calculated.';
	if (result.points.length === 0) return `${result.label}: no matching data.`;

	const total = result.points.reduce((sum, point) => sum + point.value, 0);
	const formattedTotal = new Intl.NumberFormat('en').format(total);
	return `${result.label}: ${formattedTotal} applications across ${result.points.length} ${result.bucket} buckets.`;
}

function formatPrediction(result: AnalyticsResult) {
	if (result.type !== 'prediction') return 'The prediction summary was calculated.';

	const formattedRuns = new Intl.NumberFormat('en').format(result.summary.runs);
	return `${result.label}: ${formattedRuns} saved runs.`;
}

const logAnalyticsEvent = (
	event: string,
	fields: Record<string, unknown>,
) => {
	console.log(JSON.stringify({ event, ...fields }));
};

export type AnalyticsService = ReturnType<typeof createAnalyticsService>;
