import {
	decimal,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

export const programStatusEnum = pgEnum('program_status', [
	'open',
	'under_review',
	'closed',
]);

export const scholarshipPrograms = pgTable('scholarship_programs', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	total: decimal('total_budget'),
	status: programStatusEnum('status').default('open'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
});

export type ScholarshipProgram = typeof scholarshipPrograms.$inferSelect;
export type NewScholarshipProgram = typeof scholarshipPrograms.$inferInsert;
