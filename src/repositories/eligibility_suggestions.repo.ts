import type { Db } from '@/db';
import {
	applications,
	eligibilitySuggestionRuns,
	eligibilitySuggestions,
	type NewEligibilitySuggestion,
	type NewEligibilitySuggestionRun,
} from '@/db/schema';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

const suggestionApplicationWithRelations = {
	addresses: true,
	parents: true,
	offering: true,
	student: true,
	course: true,
} as const;

export const createEligibilitySuggestionsRepo = (db: Db) => ({
	findRunByOfferingId: (offeringId: string) =>
		db.query.eligibilitySuggestionRuns
			.findFirst({
				where: eq(eligibilitySuggestionRuns.offeringId, offeringId),
				with: {
					generatedByUser: true,
				},
			})
			.then((r) => r ?? null),

	findRunsByOfferingId: (offeringId: string) =>
		db.query.eligibilitySuggestionRuns.findMany({
			where: eq(eligibilitySuggestionRuns.offeringId, offeringId),
			orderBy: desc(eligibilitySuggestionRuns.generatedAt),
			with: {
				generatedByUser: true,
			},
		}),

	findRunDetail: (offeringId: string, runId: string) =>
		db.query.eligibilitySuggestionRuns
			.findFirst({
				where: and(
					eq(eligibilitySuggestionRuns.id, runId),
					eq(eligibilitySuggestionRuns.offeringId, offeringId),
				),
				with: {
					generatedByUser: true,
					suggestions: {
						orderBy: asc(eligibilitySuggestions.rank),
						with: {
							application: {
								with: suggestionApplicationWithRelations,
							},
						},
					},
				},
			})
			.then((r) => r ?? null),

	createRunWithSuggestionsAndMarkApplications: async (
		runData: NewEligibilitySuggestionRun,
		suggestionsData: Omit<NewEligibilitySuggestion, 'runId'>[],
		applicationIds: string[],
		reviewedAt: string,
	) =>
		db.transaction(async (tx) => {
			const run = await tx
				.insert(eligibilitySuggestionRuns)
				.values(runData)
				.returning()
				.then((r) => r[0]);

			if (suggestionsData.length > 0) {
				await tx.insert(eligibilitySuggestions).values(
					suggestionsData.map((suggestion) => ({
						...suggestion,
						runId: run.id,
					})),
				);
			}

			if (applicationIds.length > 0) {
				await tx
					.update(applications)
					.set({
						status: 'under_review',
						updatedAt: reviewedAt,
					})
					.where(inArray(applications.id, applicationIds));
			}

			const updatedApplications =
				applicationIds.length === 0
					? []
					: await tx.query.applications.findMany({
							where: inArray(applications.id, applicationIds),
							with: suggestionApplicationWithRelations,
						});

			return { run, updatedApplications };
		}),
});

export type EligibilitySuggestionsRepo = ReturnType<
	typeof createEligibilitySuggestionsRepo
>;

export type EligibilitySuggestionRunDetail = NonNullable<
	Awaited<ReturnType<EligibilitySuggestionsRepo['findRunDetail']>>
>;
