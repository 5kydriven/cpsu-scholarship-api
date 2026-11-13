import type {
	AnalyticsClassification,
	AnalyticsServiceDependencies,
} from '@/types/analytics';

const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const resolveAnalyticsFilterNames = async (
	classification: AnalyticsClassification,
	deps: Pick<
		AnalyticsServiceDependencies,
		'coursesRepo' | 'scholarshipProgramsRepo' | 'programOfferingsRepo'
	>,
): Promise<AnalyticsClassification> => {
	if (classification.metric === 'unsupported' || !classification.filters) {
		return classification;
	}

	const filters = { ...classification.filters };

	if (filters.courseId && !isUuid(filters.courseId)) {
		const resolved = await resolveSingleId(
			deps.coursesRepo.findByNameOrAbbreviation(filters.courseId),
		);
		if (!resolved) return unsupportedForMissingFilter();
		if (resolved === 'ambiguous') return unsupportedForAmbiguousFilter();
		filters.courseId = resolved;
	}

	if (filters.programId && !isUuid(filters.programId)) {
		const resolved = await resolveSingleId(
			deps.scholarshipProgramsRepo.findByName(filters.programId),
		);
		if (!resolved) return unsupportedForMissingFilter();
		if (resolved === 'ambiguous') return unsupportedForAmbiguousFilter();
		filters.programId = resolved;
	}

	if (filters.offeringId && !isUuid(filters.offeringId)) {
		const resolved = await resolveSingleId(
			deps.programOfferingsRepo.findByLabel(filters.offeringId),
		);
		if (!resolved) return unsupportedForMissingFilter();
		if (resolved === 'ambiguous') return unsupportedForAmbiguousFilter();
		filters.offeringId = resolved;
	}

	return {
		...classification,
		filters,
	};
};

const isUuid = (value: string) => uuidPattern.test(value);

const resolveSingleId = async (rowsPromise: Promise<{ id: string }[]>) => {
	const rows = await rowsPromise;
	if (rows.length === 0) return null;
	if (rows.length > 1) return 'ambiguous' as const;
	return rows[0].id;
};

const unsupportedForMissingFilter = (): AnalyticsClassification => ({
	metric: 'unsupported',
	unsupportedReason: 'missing_filter',
});

const unsupportedForAmbiguousFilter = (): AnalyticsClassification => ({
	metric: 'unsupported',
	unsupportedReason: 'ambiguous',
});
