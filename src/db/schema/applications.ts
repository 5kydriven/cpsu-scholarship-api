import { relations } from 'drizzle-orm';
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';
import { addresses } from './addresses';
import { courses } from './course';
import { parents } from './parents';
import { programOfferings } from './program_offerings';
import { student } from './student';

export const applications = pgTable(
	'applications',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		studentId: uuid('student_id')
			.notNull()
			.references(() => student.id, { onDelete: 'cascade' }),
		offeringId: uuid('offering_id')
			.notNull()
			.references(() => programOfferings.id),
		courseId: uuid('course_id').references(() => courses.id),
		firstName: text('first_name').notNull(),
		lastName: text('last_name').notNull(),
		middleName: text('middle_name'),
		extName: text('ext_name'),
		gender: text('gender').notNull(),
		birthdate: text('birthdate').notNull(),
		yearLevel: text('year_level').notNull(),
		gwa: text('gwa').notNull(),
		citizenship: text('citizenship').notNull(),
		birthplace: text('birthplace').notNull(),
		email: text('email').notNull(),
		numberOfSiblings: text('number_of_siblings').notNull(),
		contactNumber: text('contact_number').notNull(),
		schoolSector: text('school_sector').notNull(),
		schoolName: text('school_name').notNull(),
		schoolAddress: text('school_address').notNull(),
		otherFinancialAssistance: text('other_financial_assistance'),
		pwdUrl: text('pwd_url'),
		ipUrl: text('ip_url'),
		fourPsUrl: text('fourps_url'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex('applications_student_id_offering_id_unique').on(
			table.studentId,
			table.offeringId,
		),
		index('idx_applications_offering_id').on(table.offeringId),
		index('idx_applications_course_id').on(table.courseId),
	],
);

export const applicationsRelations = relations(
	applications,
	({ many, one }) => ({
		addresses: many(addresses),
		parents: many(parents),
		offering: one(programOfferings, {
			fields: [applications.offeringId],
			references: [programOfferings.id],
		}),
		student: one(student, {
			fields: [applications.studentId],
			references: [student.id],
		}),
		course: one(courses, {
			fields: [applications.courseId],
			references: [courses.id],
		}),
	}),
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
