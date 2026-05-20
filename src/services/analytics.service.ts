import type {
	AnalyticsChatResponse,
	AnalyticsQueryRequest,
	AnalyticsQueryResponse,
} from '@/modules/analytics/analytics.schema';
import type {
	AnalyticsChatRequestWithHistory,
	AnalyticsServiceDependencies,
} from '@/types/analytics';
import {
	classifyMetric,
	generateAnalyticsAnswer,
	logAnalyticsEvent,
} from '@/utils/analytics-chat-ai';
import {
	buildDataInjection,
	buildUnsupportedDataInjection,
	fallbackUnsupportedAnswer,
} from '@/utils/analytics-format';
import { resolveAnalyticsFilterNames } from '@/utils/analytics-filters';
import {
	getMetricDefinition,
	metricDefinitions,
	toPublicMetricDefinition,
	validateSupportedOptions,
} from '@/utils/analytics-metrics';
import { ANALYTICS_AI_MODEL } from '@/utils/analytics-prompts';

export const createAnalyticsService = (deps: AnalyticsServiceDependencies) => {
	const query = async (
		request: AnalyticsQueryRequest,
	): Promise<AnalyticsQueryResponse> => {
		const generatedAt = new Date().toISOString();
		const start = performance.now();
		const definition = getMetricDefinition(request.metric);
		const filters = request.filters ?? {};

		validateSupportedOptions(definition, request);

		const dbStart = performance.now();
		const result = await definition.resolve(deps.analyticsRepo, {
			...request,
			filters,
		});
		const dbDurationMs = Math.round(performance.now() - dbStart);
		const answer = definition.format(result);

		logAnalyticsEvent('analytics_query', {
			metric: request.metric,
			filters,
			resultType: result.type,
			dbDurationMs,
			totalDurationMs: Math.round(performance.now() - start),
		});

		return {
			answer,
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

		async chat(
			request: AnalyticsChatRequestWithHistory,
		): Promise<AnalyticsChatResponse> {
			const generatedAt = new Date().toISOString();
			const start = performance.now();
			const rawClassification = await classifyMetric(deps.ai, request);
			const resolvedClassification = await resolveAnalyticsFilterNames(
				rawClassification,
				deps,
			);
			const classification = {
				...resolvedClassification,
				source: rawClassification.source,
			};

			if (classification.metric === 'unsupported') {
				const unsupportedReason =
					classification.unsupportedReason ?? 'unsupported_metric';
				const injection = buildUnsupportedDataInjection(unsupportedReason);
				const answer = await generateAnalyticsAnswer(
					deps.ai,
					request,
					injection,
					fallbackUnsupportedAnswer,
				);

				logAnalyticsEvent('analytics_chat_unsupported', {
					classificationSource: classification.source,
					unsupportedReason,
					totalDurationMs: Math.round(performance.now() - start),
				});

				return {
					answer,
					metric: null,
					result: null,
					filters: {},
					generatedAt,
					unsupportedReason,
				};
			}

			const response = await query({
				metric: classification.metric,
				filters: classification.filters ?? {},
				groupBy: classification.groupBy,
				bucket: classification.bucket,
			});
			const definition = getMetricDefinition(classification.metric);
			const injection = buildDataInjection(
				response.result,
				definition.format(response.result),
			);
			const answer = await generateAnalyticsAnswer(
				deps.ai,
				request,
				injection,
				response.answer,
			);

			logAnalyticsEvent('analytics_chat_routed', {
				metric: classification.metric,
				filters: response.filters,
				resultType: response.result.type,
				classificationSource: classification.source,
				aiModel: deps.ai ? ANALYTICS_AI_MODEL : null,
				totalDurationMs: Math.round(performance.now() - start),
			});

			return {
				...response,
				answer,
				unsupportedReason: null,
			};
		},
	};
};

export type AnalyticsService = ReturnType<typeof createAnalyticsService>;
