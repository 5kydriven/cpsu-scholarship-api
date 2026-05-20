import {
	AnalyticsGroupBySchema,
	AnalyticsMetricSchema,
	AnalyticsTimeBucketSchema,
} from '@/modules/analytics/analytics.schema';
import type {
	AnalyticsAiMessage,
	AnalyticsChatRequestWithHistory,
	AnalyticsClassification,
} from '@/types/analytics';
import {
	getAnalyticsClassifierSystemPrompt,
	getAnalyticsResponseSystemPrompt,
} from '@/utils/analytics-prompts';

export const classificationSchema = {
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

export const buildClassifierMessages = (
	request: AnalyticsChatRequestWithHistory,
	currentDate: string,
): AnalyticsAiMessage[] => [
	{
		role: 'system',
		content: getAnalyticsClassifierSystemPrompt(currentDate),
	},
	...(request.history ?? []),
	{
		role: 'user',
		content: request.message,
	},
];

export const buildResponseMessages = (
	request: AnalyticsChatRequestWithHistory,
	injection: string,
): AnalyticsAiMessage[] => [
	{
		role: 'system',
		content: getAnalyticsResponseSystemPrompt(),
	},
	...(request.history ?? []),
	{
		role: 'user',
		content: request.message,
	},
	{
		role: 'assistant',
		content: injection,
	},
];

export const parseAiResponse = (response: unknown): unknown => {
	if (typeof response === 'string') return parseJson(response);

	if (!response || typeof response !== 'object') return null;

	if ('response' in response) {
		const content = response.response;
		return typeof content === 'string' ? parseJson(content) : content;
	}

	return response;
};

export const parseAiTextResponse = (response: unknown): string | null => {
	if (typeof response === 'string') return response.trim() || null;
	if (!response || typeof response !== 'object') return null;
	if (!('response' in response) || typeof response.response !== 'string') {
		return null;
	}

	return response.response.trim() || null;
};

export const isClassification = (
	value: unknown,
): value is AnalyticsClassification => {
	if (!value || typeof value !== 'object') return false;
	if (!('metric' in value) || typeof value.metric !== 'string') return false;

	if (
		value.metric !== 'unsupported' &&
		!AnalyticsMetricSchema.safeParse(value.metric).success
	) {
		return false;
	}

	if ('filters' in value && value.filters !== undefined) {
		if (!value.filters || typeof value.filters !== 'object') return false;
		const filters = value.filters as Record<string, unknown>;
		const allowedFilters = [
			'offeringId',
			'programId',
			'courseId',
			'schoolYear',
			'status',
			'from',
			'to',
		];
		if (Object.keys(filters).some((key) => !allowedFilters.includes(key))) {
			return false;
		}
		if (
			filters.status !== undefined &&
			!['pending', 'under_review', 'approved', 'rejected'].includes(
				String(filters.status),
			)
		) {
			return false;
		}
		if (
			Object.entries(filters).some(
				([key, item]) => key !== 'status' && typeof item !== 'string',
			)
		) {
			return false;
		}
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

const parseJson = (value: string) => {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};
