import { Errors } from '@/lib/errors';
import type {
	AnalyticsFilterKey,
	AnalyticsMetric,
	AnalyticsMetricDefinition,
	AnalyticsQueryRequest,
	AnalyticsResult,
	AnalyticsResultType,
} from '@/modules/analytics/analytics.schema';
import type { AnalyticsInternalMetricDefinition } from '@/types/analytics';
import { formatAnalyticsResult } from '@/utils/analytics-format';

const scalarResult = (input: {
	label: string;
	value: number;
	unit: string;
}): AnalyticsResult => ({
	type: 'scalar',
	...input,
});

export const metricDefinitions: AnalyticsInternalMetricDefinition[] = [
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
		resolve: async (repo, request) =>
			scalarResult({
				label: 'Total students',
				unit: 'students',
				value: await repo.countStudents(request.filters ?? {}),
			}),
		format: formatAnalyticsResult,
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
		resolve: async (repo, request) =>
			scalarResult({
				label: 'Approved scholars',
				unit: 'students',
				value: await repo.countApprovedScholars(request.filters ?? {}),
			}),
		format: formatAnalyticsResult,
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
		resolve: async (repo, request) =>
			scalarResult({
				label: 'Pending applications',
				unit: 'applications',
				value: await repo.countApplications({
					...(request.filters ?? {}),
					status: 'pending',
				}),
			}),
		format: formatAnalyticsResult,
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
		resolve: async (repo, request) =>
			scalarResult({
				label: 'Approved applications',
				unit: 'applications',
				value: await repo.countApplications({
					...(request.filters ?? {}),
					status: 'approved',
				}),
			}),
		format: formatAnalyticsResult,
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
		resolve: async (repo, request) =>
			scalarResult({
				label: 'Registered allowlist students',
				unit: 'students',
				value: await repo.countRegisteredAllowlist(request.filters ?? {}),
			}),
		format: formatAnalyticsResult,
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
		format: formatAnalyticsResult,
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
		format: formatAnalyticsResult,
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
		format: formatAnalyticsResult,
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
		format: formatAnalyticsResult,
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
		format: formatAnalyticsResult,
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
		format: formatAnalyticsResult,
	},
];

const metricsById = new Map(
	metricDefinitions.map((metric) => [metric.id, metric]),
);

export const getMetricDefinition = (metric: AnalyticsMetric) => {
	const definition = metricsById.get(metric);
	if (!definition) {
		throw Errors.validation([
			{ field: 'metric', message: `Unsupported analytics metric: ${metric}` },
		]);
	}

	return definition;
};

export const validateSupportedOptions = (
	definition: AnalyticsInternalMetricDefinition,
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

export const toPublicMetricDefinition = (
	definition: AnalyticsInternalMetricDefinition,
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
