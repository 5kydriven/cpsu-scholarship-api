import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { scholarshipPrograms } from '.';

export const programOfferings = pgTable(
	'program_offerings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		scholarshipProgramId: uuid('program_id').references(
			() => scholarshipPrograms.id,
			{
				onDelete: 'set null',
			},
		),
		schoolYear: text('school_year').notNull(),
		totalBudget: numeric('total_budget', { precision: 10, scale: 2 }).notNull(),
		amountPerSemester: numeric('amount_per_semester', {
			precision: 10,
			scale: 2,
		})
			.notNull()
			.default('0'),
		pwdAdditional: numeric('pwd_additional', { precision: 10, scale: 2 })
			.notNull()
			.default('0'),
		isActive: boolean('is_active').notNull().default(true),
		isArchived: boolean('is_archived').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('idx_program_offerings_program_id').on(table.scholarshipProgramId),
		check(
			'chk_no_active_archived',
			sql`NOT (${table.isActive} = true AND ${table.isArchived} = true)`,
		),
	],
);

export type ProgramOffering = typeof programOfferings.$inferSelect;
export type NewProgramOffering = typeof programOfferings.$inferInsert;
