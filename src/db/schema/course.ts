import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;