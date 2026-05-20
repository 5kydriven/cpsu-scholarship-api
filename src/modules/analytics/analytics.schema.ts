import { USER_ROLES } from '@/constants/roles';
import { z } from '@hono/zod-openapi';

export const AnalyticsMetricSchema = z.enum([
	'total_students',
	'approved_scholars',
	'pending_applications',
	'approved_applications',
	'registered_allowlist',
	'applications_by_status',
	'applications_by_course',
	'applications_by_offering',
	'applications_by_school_year',
	'applications_over_time',
	'eligibility_prediction_runs',
]);

export const AnalyticsFilterKeySchema = z.enum([
	'offeringId',
	'programId',
	'courseId',
	'schoolYear',
	'status',
	'from',
	'to',
]);

export const AnalyticsGroupBySchema = z.enum([
	'status',
	'course',
	'offering',
	'schoolYear',
]);

export const AnalyticsTimeBucketSchema = z.enum(['day', 'month', 'year']);

export const AnalyticsResultTypeSchema = z.enum([
	'scalar',
	'breakdown',
	'series',
	'prediction',
]);

export const AnalyticsFiltersSchema = z
	.object({
		offeringId: z.uuid().optional().openapi({
			example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
		}),
		programId: z.uuid().optional().openapi({
			example: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
		}),
		courseId: z.uuid().optional().openapi({
			example: 'd4e5f6a7-b8c9-0123-defa-456789012345',
		}),
		schoolYear: z.string().trim().min(1).max(32).optional().openapi({
			example: '2025-2026',
		}),
		status: z
			.enum(['pending', 'under_review', 'approved', 'rejected'])
			.optional()
			.openapi({ example: 'approved' }),
		from: z.iso.datetime().optional().openapi({
			example: '2026-01-01T00:00:00.000Z',
		}),
		to: z.iso.datetime().optional().openapi({
			example: '2026-12-31T23:59:59.999Z',
		}),
	})
	.strict();

export const AnalyticsMetricDefinitionSchema = z.object({
	id: AnalyticsMetricSchema,
	label: z.string().openapi({ example: 'Total students' }),
	description: z.string().openapi({
		example: 'Counts all registered student profiles.',
	}),
	resultType: AnalyticsResultTypeSchema,
	allowedRoles: z.enum(USER_ROLES).array().openapi({
		example: ['personnel', 'admin'],
	}),
	supportedFilters: AnalyticsFilterKeySchema.array().openapi({
		example: ['courseId', 'from', 'to'],
	}),
	supportedGroupBy: AnalyticsGroupBySchema.array().openapi({
		example: ['status'],
	}),
	supportedBuckets: AnalyticsTimeBucketSchema.array().openapi({
		example: ['day', 'month', 'year'],
	}),
	chatEnabled: z.boolean().openapi({ example: true }),
});

export const AnalyticsMetricsResponseSchema = z.object({
	data: AnalyticsMetricDefinitionSchema.array(),
});

export const AnalyticsQueryRequestSchema = z
	.object({
		metric: AnalyticsMetricSchema.openapi({
			example: 'applications_by_status',
		}),
		filters: AnalyticsFiltersSchema.optional(),
		groupBy: AnalyticsGroupBySchema.optional().openapi({ example: 'status' }),
		bucket: AnalyticsTimeBucketSchema.optional().openapi({ example: 'month' }),
	})
	.strict();

export const AnalyticsScalarResultSchema = z.object({
	type: z.literal('scalar'),
	label: z.string().openapi({ example: 'Approved applications' }),
	value: z.number().nonnegative().openapi({ example: 1250 }),
	unit: z.string().openapi({ example: 'applications' }),
});

export const AnalyticsBreakdownResultSchema = z.object({
	type: z.literal('breakdown'),
	label: z.string().openapi({ example: 'Applications by status' }),
	dimension: AnalyticsGroupBySchema,
	items: z
		.object({
			key: z.string().openapi({ example: 'approved' }),
			label: z.string().openapi({ example: 'Approved' }),
			value: z.number().nonnegative().openapi({ example: 420 }),
		})
		.array(),
});

export const AnalyticsSeriesResultSchema = z.object({
	type: z.literal('series'),
	label: z.string().openapi({ example: 'Applications over time' }),
	bucket: AnalyticsTimeBucketSchema,
	points: z
		.object({
			bucketStart: z.string().openapi({ example: '2026-05-01' }),
			value: z.number().nonnegative().openapi({ example: 86 }),
		})
		.array(),
});

export const AnalyticsPredictionResultSchema = z.object({
	type: z.literal('prediction'),
	label: z.string().openapi({ example: 'Eligibility prediction runs' }),
	summary: z.object({
		runs: z.number().int().nonnegative().openapi({ example: 3 }),
		latestGeneratedAt: z
			.string()
			.nullable()
			.openapi({ example: '2026-05-20T08:45:00.000Z' }),
		modelVersion: z.string().nullable().openapi({ example: null }),
		confidence: z.number().min(0).max(1).nullable().openapi({ example: null }),
	}),
	records: z
		.object({
			runId: z.uuid().openapi({
				example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			}),
			offeringId: z.uuid().openapi({
				example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
			}),
			generatedAt: z.string().openapi({
				example: '2026-05-20T08:45:00.000Z',
			}),
			suggestedCount: z.number().int().nonnegative().openapi({ example: 25 }),
			criteriaSnapshot: z.unknown(),
		})
		.array(),
});

export const AnalyticsResultSchema = z.discriminatedUnion('type', [
	AnalyticsScalarResultSchema,
	AnalyticsBreakdownResultSchema,
	AnalyticsSeriesResultSchema,
	AnalyticsPredictionResultSchema,
]);

export const AnalyticsQueryResponseSchema = z.object({
	answer: z.string().openapi({
		example: 'There are 420 approved applications as of now.',
	}),
	metric: AnalyticsMetricSchema,
	result: AnalyticsResultSchema,
	filters: AnalyticsFiltersSchema,
	generatedAt: z.string().openapi({ example: '2026-05-20T08:45:00.000Z' }),
});

export const AnalyticsChatRequestSchema = z
	.object({
		message: z
			.string()
			.trim()
			.min(1)
			.max(1000)
			.openapi({ example: 'How many students are there as of now?' }),
	})
	.strict();

export const AnalyticsChatResponseSchema = z.object({
	answer: z.string().openapi({
		example: 'There are 1,250 students as of now.',
	}),
	metric: AnalyticsMetricSchema.nullable().openapi({ example: 'total_students' }),
	result: AnalyticsResultSchema.nullable(),
	filters: AnalyticsFiltersSchema,
	generatedAt: z.string().openapi({ example: '2026-05-20T08:45:00.000Z' }),
	unsupportedReason: z
		.enum(['unsupported_metric', 'missing_filter', 'ambiguous'])
		.nullable()
		.openapi({ example: null }),
});

export type AnalyticsMetric = z.infer<typeof AnalyticsMetricSchema>;
export type AnalyticsFilterKey = z.infer<typeof AnalyticsFilterKeySchema>;
export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>;
export type AnalyticsGroupBy = z.infer<typeof AnalyticsGroupBySchema>;
export type AnalyticsTimeBucket = z.infer<typeof AnalyticsTimeBucketSchema>;
export type AnalyticsResultType = z.infer<typeof AnalyticsResultTypeSchema>;
export type AnalyticsMetricDefinition = z.infer<
	typeof AnalyticsMetricDefinitionSchema
>;
export type AnalyticsQueryRequest = z.infer<typeof AnalyticsQueryRequestSchema>;
export type AnalyticsQueryResponse = z.infer<
	typeof AnalyticsQueryResponseSchema
>;
export type AnalyticsChatRequest = z.infer<typeof AnalyticsChatRequestSchema>;
export type AnalyticsChatResponse = z.infer<typeof AnalyticsChatResponseSchema>;
export type AnalyticsResult = z.infer<typeof AnalyticsResultSchema>;
