import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { courses } from './course';
import { studentAllowlist } from './student_allowlist';

export const student = pgTable(
	'students',
	{
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
		firstName: text('first_name'),
		lastName: text('last_name'),
		middleName: text('middle_name'),
		extName: text('ext_name'),
		courseId: uuid('course_id').references(() => courses.id),
		email: text('email').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('idx_students_email').on(table.email),
		index('idx_students_course_id').on(table.courseId),
	],
);

export const studentRelations = relations(student, ({ one }) => ({
	course: one(courses, {
		fields: [student.courseId],
		references: [courses.id],
	}),
}));

export type Student = typeof student.$inferSelect;
export type NewStudent = typeof student.$inferInsert;
