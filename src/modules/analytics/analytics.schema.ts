import z from 'zod';

export const AnalyticsMetricSchema = z.enum([
	'total_students',
	'approved_scholars',
	'pending_applications',
	'approved_applications',
	'registered_allowlist',
]);

export const AnalyticsChatRequestSchema = z.object({
	message: z
		.string()
		.trim()
		.min(1)
		.max(1000)
		.openapi({ example: 'How many students are there as of now?' }),
}).strict();

export const AnalyticsChatResponseSchema = z.object({
	answer: z
		.string()
		.openapi({ example: 'There are 1,250 students as of now.' }),
	metric: AnalyticsMetricSchema.nullable().openapi({ example: 'total_students' }),
	value: z.number().int().nonnegative().nullable().openapi({ example: 1250 }),
	filters: z.object({}),
	generatedAt: z
		.string()
		.openapi({ example: '2026-05-20T08:45:00.000Z' }),
});

export type AnalyticsMetric = z.infer<typeof AnalyticsMetricSchema>;
export type AnalyticsChatRequest = z.infer<typeof AnalyticsChatRequestSchema>;
export type AnalyticsChatResponse = z.infer<typeof AnalyticsChatResponseSchema>;
