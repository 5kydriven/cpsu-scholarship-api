import {
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { applications } from './applications';

export const parentTypeEnum = pgEnum('parent_type', [
	'mother',
	'father',
	'guardian',
]);

export const parents = pgTable(
	'parents',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		applicationId: uuid('application_id')
			.notNull()
			.references(() => applications.id, {
				onDelete: 'cascade',
			}),
		isDeceased: text('is_deceased'),
		type: parentTypeEnum('type').notNull(),
		firstName: text('first_name').notNull(),
		lastName: text('last_name').notNull(),
		middleName: text('middle_name'),
		extName: text('ext_name'),
		occupation: text('occupation'),
		monthlyIncome: text('monthly_income').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [index('idx_parents_application_id').on(table.applicationId)],
);

export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
