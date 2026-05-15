import type { Db } from '@/db';
import {
	eligibilitySuggestionRuns,
	eligibilitySuggestions,
	type NewEligibilitySuggestion,
	type NewEligibilitySuggestionRun,
} from '@/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';

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

	createRun: (data: NewEligibilitySuggestionRun) =>
		db
			.insert(eligibilitySuggestionRuns)
			.values(data)
			.returning()
			.then((r) => r[0]),

	createSuggestions: (data: NewEligibilitySuggestion[]) =>
		data.length === 0
			? Promise.resolve([])
			: db
					.insert(eligibilitySuggestions)
					.values(data)
					.returning(),
});

export type EligibilitySuggestionsRepo = ReturnType<
	typeof createEligibilitySuggestionsRepo
>;

export type EligibilitySuggestionRunDetail = NonNullable<
	Awaited<ReturnType<EligibilitySuggestionsRepo['findRunDetail']>>
>;
