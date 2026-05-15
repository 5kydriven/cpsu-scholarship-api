import { relations } from 'drizzle-orm';
import {
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';
import { applications } from './applications';
import { user } from './auth';
import { programOfferings } from './program_offerings';

export type EligibilityCriteriaSnapshot = {
	maxGwa: number;
	maxAnnualFamilyIncomeExclusive: number;
	priorityProofs: string[];
	rankingOrder: string[];
};

export const eligibilitySuggestionRuns = pgTable(
	'eligibility_suggestion_runs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		offeringId: uuid('offering_id')
			.notNull()
			.references(() => programOfferings.id, { onDelete: 'cascade' }),
		generatedBy: text('generated_by')
			.notNull()
			.references(() => user.id),
		generatedAt: timestamp('generated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		criteriaSnapshot: jsonb('criteria_snapshot')
			.$type<EligibilityCriteriaSnapshot>()
			.notNull(),
		suggestedCount: integer('suggested_count').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex('eligibility_suggestion_runs_offering_id_unique').on(
			table.offeringId,
		),
		index('idx_eligibility_suggestion_runs_generated_by').on(
			table.generatedBy,
		),
	],
);

export const eligibilitySuggestions = pgTable(
	'eligibility_suggestions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		runId: uuid('run_id')
			.notNull()
			.references(() => eligibilitySuggestionRuns.id, { onDelete: 'cascade' }),
		applicationId: uuid('application_id')
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		rank: integer('rank').notNull(),
		gwa: numeric('gwa', { precision: 4, scale: 2 }).notNull(),
		annualFamilyIncome: numeric('annual_family_income', {
			precision: 12,
			scale: 2,
		}).notNull(),
		priorityProofs: jsonb('priority_proofs').$type<string[]>().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('idx_eligibility_suggestions_run_id').on(table.runId),
		index('idx_eligibility_suggestions_application_id').on(
			table.applicationId,
		),
		uniqueIndex('eligibility_suggestions_run_rank_unique').on(
			table.runId,
			table.rank,
		),
		uniqueIndex('eligibility_suggestions_run_application_unique').on(
			table.runId,
			table.applicationId,
		),
	],
);

export const eligibilitySuggestionRunsRelations = relations(
	eligibilitySuggestionRuns,
	({ many, one }) => ({
		offering: one(programOfferings, {
			fields: [eligibilitySuggestionRuns.offeringId],
			references: [programOfferings.id],
		}),
		generatedByUser: one(user, {
			fields: [eligibilitySuggestionRuns.generatedBy],
			references: [user.id],
		}),
		suggestions: many(eligibilitySuggestions),
	}),
);

export const eligibilitySuggestionsRelations = relations(
	eligibilitySuggestions,
	({ one }) => ({
		run: one(eligibilitySuggestionRuns, {
			fields: [eligibilitySuggestions.runId],
			references: [eligibilitySuggestionRuns.id],
		}),
		application: one(applications, {
			fields: [eligibilitySuggestions.applicationId],
			references: [applications.id],
		}),
	}),
);

export type EligibilitySuggestionRun =
	typeof eligibilitySuggestionRuns.$inferSelect;
export type NewEligibilitySuggestionRun =
	typeof eligibilitySuggestionRuns.$inferInsert;
export type EligibilitySuggestion = typeof eligibilitySuggestions.$inferSelect;
export type NewEligibilitySuggestion =
	typeof eligibilitySuggestions.$inferInsert;
