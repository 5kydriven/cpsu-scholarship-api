import type {
	AnalyticsChatRequestWithHistory,
	AnalyticsClassification,
} from '@/types/analytics';

export const classifyMetricLocally = (
	request: AnalyticsChatRequestWithHistory,
): AnalyticsClassification => {
	const message = request.message.toLowerCase();

	if (
		/\b(prediction|predictions|suggestion|suggestions|eligibility runs?)\b/.test(
			message,
		)
	) {
		return { metric: 'eligibility_prediction_runs' };
	}

	if (
		/\b(over time|trend|trends|monthly|daily|yearly|by month|by day|by year)\b/.test(
			message,
		)
	) {
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

	if (
		/\b(pending)\b/.test(message) &&
		/\b(application|applications)\b/.test(message)
	) {
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
