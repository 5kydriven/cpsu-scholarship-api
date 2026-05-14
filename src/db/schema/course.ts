import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import z from 'zod';

export const courses = pgTable('courses', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	abbreviation: text('abbreviation').notNull(),
	major: text('major'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
});

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
	createSchemaFactory({ zodInstance: z });

export const courseSelectSchema = createSelectSchema(courses, {
	name: (schema) =>
		schema.openapi({
			example: 'Bacgelor of Science in Information Technology',
		}),
	abbreviation: (schema) => schema.openapi({ example: 'BSIT' }),
	major: (schema) => schema.openapi({ example: 'Programming' }),
});

export const courseInsertSchema = createInsertSchema(courses, {
	name: (schema) =>
		schema.openapi({
			example: 'Bacgelor of Science in Information Technology',
		}),
	abbreviation: (schema) => schema.openapi({ example: 'BSIT' }),
	major: (schema) => schema.openapi({ example: 'Programming' }),
}).omit({
	updatedAt: true,
	createdAt: true,
	id: true,
});

export const courseUpdateSchema = createUpdateSchema(courses, {
	name: (schema) =>
		schema.openapi({
			example: 'Bacgelor of Science in Information Technology',
		}),
	abbreviation: (schema) => schema.openapi({ example: 'BSIT' }),
	major: (schema) => schema.openapi({ example: 'Programming' }),
}).omit({
	updatedAt: true,
	createdAt: true,
	id: true,
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
