import type { AnalyticsRepo } from '@/repositories/analytics.repo';
import type {
	AnalyticsChatRequest,
	AnalyticsChatResponse,
	AnalyticsMetric,
} from '@/modules/analytics/analytics.schema';
import { AnalyticsMetricSchema } from '@/modules/analytics/analytics.schema';

const model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

type AnalyticsClassification = {
	metric: AnalyticsMetric | 'unsupported';
	needsOfferingId: boolean;
};

const classificationSchema = {
	type: 'object',
	properties: {
		metric: {
			type: 'string',
			enum: [...AnalyticsMetricSchema.options, 'unsupported'],
		},
		needsOfferingId: {
			type: 'boolean',
		},
	},
	required: ['metric', 'needsOfferingId'],
	additionalProperties: false,
};

export const createAnalyticsService = (analyticsRepo: AnalyticsRepo, ai: Ai) => ({
	async chat(request: AnalyticsChatRequest): Promise<AnalyticsChatResponse> {
		const generatedAt = new Date().toISOString();
		const classification = await classifyMetric(ai, request);
		const metric = normalizeMetric(classification);
		const filters = {};

		if (metric === 'unsupported') {
			return {
				answer:
					'I can only answer basic scholarship counts right now, such as total students, approved scholars, applications, or registered allowlist students.',
				metric: null,
				value: null,
				filters,
				generatedAt,
			};
		}

		const value = await getMetricValue(metric, analyticsRepo);

		return {
			answer: formatAnswer(metric, value),
			metric,
			value,
			filters,
			generatedAt,
		};
	},
});

const classifyMetric = async (
	ai: Ai,
	request: AnalyticsChatRequest,
): Promise<AnalyticsClassification> => {
	const aiClassification = await classifyMetricWithAi(ai, request).catch(
		() => null,
	);

	return aiClassification ?? classifyMetricLocally(request);
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
					'Return unsupported for questions outside basic scholarship counts.',
					'Eligible students means approved scholars.',
					'If the question asks for a specific offering or program, return unsupported because this endpoint only receives a message.',
					'Never produce SQL, table names, column names, or calculations.',
				].join(' '),
			},
			{
				role: 'user',
				content: JSON.stringify({
					message: request.message,
				}),
			},
		],
		temperature: 0,
		max_tokens: 128,
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
	if (!('metric' in value) || !('needsOfferingId' in value)) return false;
	if (typeof value.metric !== 'string') return false;
	if (typeof value.needsOfferingId !== 'boolean') return false;

	return (
		value.metric === 'unsupported' ||
		AnalyticsMetricSchema.safeParse(value.metric).success
	);
};

const normalizeMetric = (
	classification: AnalyticsClassification,
) => {
	if (classification.metric === 'unsupported') return classification.metric;

	if (classification.needsOfferingId) return 'unsupported';

	return classification.metric;
};

const classifyMetricLocally = (
	request: AnalyticsChatRequest,
): AnalyticsClassification => {
	const message = request.message.toLowerCase();
	const hasOfferingIntent = /\b(offering|program)\b/.test(message);

	if (/\b(allowlist|allowlisted|registered)\b/.test(message)) {
		return { metric: 'registered_allowlist', needsOfferingId: false };
	}

	if (/\b(pending)\b/.test(message) && /\b(application|applications)\b/.test(message)) {
		return { metric: 'pending_applications', needsOfferingId: false };
	}

	if (
		/\b(approved|accepted)\b/.test(message) &&
		/\b(application|applications)\b/.test(message)
	) {
		return { metric: 'approved_applications', needsOfferingId: false };
	}

	if (
		/\b(approved|eligible)\b/.test(message) &&
		/\b(student|students)\b/.test(message)
	) {
		if (hasOfferingIntent) {
			return { metric: 'unsupported', needsOfferingId: true };
		}

		return {
			metric: 'approved_scholars',
			needsOfferingId: false,
		};
	}

	if (/\b(eligible|scholar|scholars)\b/.test(message)) {
		if (hasOfferingIntent) {
			return { metric: 'unsupported', needsOfferingId: true };
		}

		return {
			metric: 'approved_scholars',
			needsOfferingId: false,
		};
	}

	if (/\b(student|students)\b/.test(message)) {
		return { metric: 'total_students', needsOfferingId: false };
	}

	return { metric: 'unsupported', needsOfferingId: false };
};

const getMetricValue = async (
	metric: AnalyticsMetric,
	analyticsRepo: AnalyticsRepo,
) => {
	switch (metric) {
		case 'total_students':
			return analyticsRepo.countStudents();
		case 'approved_scholars':
			return analyticsRepo.countApprovedScholars();
		case 'pending_applications':
			return analyticsRepo.countPendingApplications();
		case 'approved_applications':
			return analyticsRepo.countApprovedApplications();
		case 'registered_allowlist':
			return analyticsRepo.countRegisteredAllowlist();
	}
};

const formatAnswer = (
	metric: AnalyticsMetric,
	value: number,
) => {
	const formattedValue = new Intl.NumberFormat('en').format(value);

	switch (metric) {
		case 'total_students':
			return `There are ${formattedValue} students as of now.`;
		case 'approved_scholars':
			return `There are ${formattedValue} approved scholars as of now.`;
		case 'pending_applications':
			return `There are ${formattedValue} pending applications as of now.`;
		case 'approved_applications':
			return `There are ${formattedValue} approved applications as of now.`;
		case 'registered_allowlist':
			return `There are ${formattedValue} registered students in the allowlist as of now.`;
	}
};

export type AnalyticsService = ReturnType<typeof createAnalyticsService>;
