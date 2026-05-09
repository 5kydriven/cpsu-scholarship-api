import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { studentAllowlist } from './student_allowlist';

export const student = pgTable('students', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	studentNumber: text('student_number')
		.notNull()
		.unique()
		.references(() => studentAllowlist.studentNumber),
	name: text('name').notNull(),
	email: text('email').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
});

export type Student = typeof student.$inferSelect;
export type NewStudent = typeof student.$inferInsert;
