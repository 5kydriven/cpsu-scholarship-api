import type {
	AnalyticsChatRequest,
	AnalyticsFilters,
	AnalyticsGroupBy,
	AnalyticsMetric,
	AnalyticsMetricDefinition,
	AnalyticsQueryRequest,
	AnalyticsResult,
	AnalyticsTimeBucket,
} from '@/modules/analytics/analytics.schema';
import type { AnalyticsRepo } from '@/repositories/analytics.repo';
import type { CoursesRepo } from '@/repositories/courses.repo';
import type { ProgramOfferingsRepo } from '@/repositories/program_offerings.repo';
import type { ScholarshipProgramsRepo } from '@/repositories/scholarship_programs.repo';

export type AnalyticsUnsupportedReason =
	| 'unsupported_metric'
	| 'missing_filter'
	| 'ambiguous';

export type AnalyticsChatTurn = {
	role: 'user' | 'assistant';
	content: string;
};

export type AnalyticsBreakdownRow = {
	key: string;
	label: string;
	value: number;
};

export type AnalyticsSeriesPoint = {
	bucketStart: string;
	value: number;
};

export type AnalyticsPredictionRunRow = {
	runId: string;
	offeringId: string;
	generatedAt: string;
	suggestedCount: number;
	criteriaSnapshot: unknown;
};

export type AnalyticsClassification = {
	metric: AnalyticsMetric | 'unsupported';
	filters?: AnalyticsFilters;
	groupBy?: AnalyticsGroupBy;
	bucket?: AnalyticsTimeBucket;
	unsupportedReason?: AnalyticsUnsupportedReason;
};

export type AnalyticsClassificationResult = AnalyticsClassification & {
	source: 'ai' | 'local' | 'fallback';
};

export type AnalyticsMetricResolver = (
	repo: AnalyticsRepo,
	request: AnalyticsQueryRequest,
) => Promise<AnalyticsResult>;

export type AnalyticsInternalMetricDefinition = AnalyticsMetricDefinition & {
	resolve: AnalyticsMetricResolver;
	format: (result: AnalyticsResult) => string;
};

export type AnalyticsServiceDependencies = {
	analyticsRepo: AnalyticsRepo;
	coursesRepo: CoursesRepo;
	scholarshipProgramsRepo: ScholarshipProgramsRepo;
	programOfferingsRepo: ProgramOfferingsRepo;
	ai?: Ai;
};

export type AnalyticsAiMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export type AnalyticsChatRequestWithHistory = AnalyticsChatRequest & {
	history?: AnalyticsChatTurn[];
};
