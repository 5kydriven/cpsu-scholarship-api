import type {
	AnalyticsChatRequestWithHistory,
	AnalyticsClassification,
	AnalyticsClassificationResult,
} from '@/types/analytics';
import {
	buildClassifierMessages,
	buildResponseMessages,
	classificationSchema,
	isClassification,
	parseAiResponse,
	parseAiTextResponse,
} from '@/utils/analytics-ai';
import { classifyMetricLocally } from '@/utils/analytics-classifier';
import { ANALYTICS_AI_MODEL } from '@/utils/analytics-prompts';

export const classifyMetric = async (
	ai: Ai | undefined,
	request: AnalyticsChatRequestWithHistory,
): Promise<AnalyticsClassificationResult> => {
	if (!ai) {
		return { ...classifyMetricLocally(request), source: 'fallback' };
	}

	const startedAt = performance.now();
	const aiClassification = await classifyMetricWithAi(ai, request).catch(
		(error) => {
			logAnalyticsEvent('ai_classification_failed', {
				aiModel: ANALYTICS_AI_MODEL,
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

export const generateAnalyticsAnswer = async (
	ai: Ai | undefined,
	request: AnalyticsChatRequestWithHistory,
	injection: string,
	fallbackAnswer: string,
) => {
	if (!ai) return fallbackAnswer;

	const startedAt = performance.now();
	const response = await ai
		.run(ANALYTICS_AI_MODEL, {
			messages: buildResponseMessages(request, injection),
			temperature: 0.4,
			max_tokens: 256,
		})
		.catch((error) => {
			logAnalyticsEvent('ai_response_generation_failed', {
				aiModel: ANALYTICS_AI_MODEL,
				message: error instanceof Error ? error.message : 'Unknown AI error',
				durationMs: Math.round(performance.now() - startedAt),
			});

			return null;
		});

	return parseAiTextResponse(response) ?? fallbackAnswer;
};

export const logAnalyticsEvent = (
	event: string,
	fields: Record<string, unknown>,
) => {
	console.log(JSON.stringify({ event, ...fields }));
};

const classifyMetricWithAi = async (
	ai: Ai,
	request: AnalyticsChatRequestWithHistory,
): Promise<AnalyticsClassification | null> => {
	const response = await ai.run(ANALYTICS_AI_MODEL, {
		messages: buildClassifierMessages(
			request,
			new Date().toISOString().slice(0, 10),
		),
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
