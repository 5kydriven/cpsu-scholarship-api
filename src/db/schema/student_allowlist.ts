import { sql } from 'drizzle-orm';
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const studentAllowlist = pgTable(
	'student_allowlist',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		studentNumber: text('student_number').notNull().unique(),
		name: text('name'),
		isRegistered: boolean('is_registered').default(false).notNull(),
		uploadedBy: text('uploaded_by').references(() => user.id),
		registeredUserId: text('registered_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		registeredAt: timestamp('registered_at', {
			withTimezone: true,
			mode: 'string',
		}),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex('student_allowlist_registered_user_id_unique').on(
			table.registeredUserId,
		),
		index('idx_student_allowlist_is_registered_true')
			.on(table.id)
			.where(sql`${table.isRegistered} = true`),
	],
);

export type StudentAllowlist = typeof studentAllowlist.$inferSelect;
export type NewStudentAllowlist = typeof studentAllowlist.$inferInsert;
