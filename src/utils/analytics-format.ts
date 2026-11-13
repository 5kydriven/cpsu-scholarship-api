import type { AnalyticsResult } from '@/modules/analytics/analytics.schema';

const numberFormat = new Intl.NumberFormat('en');

export const formatAnalyticsResult = (result: AnalyticsResult) => {
	switch (result.type) {
		case 'scalar':
			return formatScalar(result);
		case 'breakdown':
			return formatBreakdown(result);
		case 'series':
			return formatSeries(result);
		case 'prediction':
			return formatPrediction(result);
	}
};

export const buildDataInjection = (
	result: AnalyticsResult,
	formatted: string,
) => {
	const lines = [`[Analytics data: ${formatted}]`, `[Result type: ${result.type}]`];

	if (result.type === 'breakdown' && result.items.length > 0) {
		const top = getTopItems(result)
			.map((item) => `${item.label}=${item.value}`)
			.join(', ');
		lines.push(`[Top items: ${top}]`);
	}

	if (result.type === 'series') {
		lines.push(`[Trend direction: ${getTrendDirection(result)}]`);
	}

	if (result.type === 'prediction') {
		lines.push(`[Projected values: next_1=${result.summary.runs}]`);
	}

	return lines.join('\n');
};

export const buildUnsupportedDataInjection = (reason: string) =>
	[
		'[Analytics data: unsupported]',
		'[Result type: unsupported]',
		`[Unsupported reason: ${reason}]`,
	].join('\n');

export const getTopItems = (
	result: Extract<AnalyticsResult, { type: 'breakdown' }>,
) =>
	[...result.items]
		.sort((a, b) => b.value - a.value)
		.slice(0, 3);

export const getTrendDirection = (
	result: Extract<AnalyticsResult, { type: 'series' }>,
) => {
	if (result.points.length < 2) return 'insufficient_data';

	const first = result.points[0].value;
	const last = result.points[result.points.length - 1].value;

	if (last > first * 1.05) return 'rising';
	if (last < first * 0.95) return 'falling';
	return 'steady';
};

export const fallbackUnsupportedAnswer =
	'That is a bit outside what I can pull right now. I can help with application counts, student stats, trends, and eligibility run summaries.';

function formatScalar(result: Extract<AnalyticsResult, { type: 'scalar' }>) {
	const formattedValue = numberFormat.format(result.value);
	return `${result.label}: ${formattedValue} ${result.unit}.`;
}

function formatBreakdown(result: Extract<AnalyticsResult, { type: 'breakdown' }>) {
	if (result.items.length === 0) return `${result.label}: no matching data.`;

	const total = result.items.reduce((sum, item) => sum + item.value, 0);
	const formattedTotal = numberFormat.format(total);
	return `${result.label}: ${formattedTotal} total across ${result.items.length} groups.`;
}

function formatSeries(result: Extract<AnalyticsResult, { type: 'series' }>) {
	if (result.points.length === 0) return `${result.label}: no matching data.`;

	const total = result.points.reduce((sum, point) => sum + point.value, 0);
	const formattedTotal = numberFormat.format(total);
	return `${result.label}: ${formattedTotal} applications across ${result.points.length} ${result.bucket} buckets.`;
}

function formatPrediction(result: Extract<AnalyticsResult, { type: 'prediction' }>) {
	const formattedRuns = numberFormat.format(result.summary.runs);
	return `${result.label}: ${formattedRuns} saved runs.`;
}
