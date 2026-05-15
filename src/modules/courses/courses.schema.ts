import { courses } from '@/db/schema';
import {
	OffsetQuerySchema,
} from '@/lib/pagination';
import {
	createCursorResponseSchema,
	createOffsetResponseSchema,
	generatedFields,
	UuidIdParamsSchema,
} from '@/lib/common-schemas';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from '@/lib/drizzle-zod';
import z from 'zod';

export const CourseParamsSchema = UuidIdParamsSchema;

export const courseSelectSchema = createSelectSchema(courses, {
	id: (schema) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	name: (schema) =>
		schema.openapi({
			example: 'Bacgelor of Science in Information Technology',
		}),
	abbreviation: (schema) => schema.openapi({ example: 'BSIT' }),
	major: (schema) => schema.openapi({ example: 'Programming' }),
	createdAt: (schema) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: (schema) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
});

export const courseInsertSchema = createInsertSchema(courses, {
	name: (schema) =>
		schema.openapi({
			example: 'Bacgelor of Science in Information Technology',
		}),
	abbreviation: (schema) => schema.openapi({ example: 'BSIT' }),
	major: (schema) => schema.openapi({ example: 'Programming' }),
}).omit({
	...generatedFields,
});

export const courseUpdateSchema = createUpdateSchema(courses, {
	name: (schema) =>
		schema.openapi({
			example: 'Bacgelor of Science in Information Technology',
		}),
	abbreviation: (schema) => schema.openapi({ example: 'BSIT' }),
	major: (schema) => schema.openapi({ example: 'Programming' }),
}).omit({
	...generatedFields,
});

export const CoursesOffsetResponseSchema =
	createOffsetResponseSchema(courseSelectSchema);

export const CoursesCursorResponseSchema =
	createCursorResponseSchema(courseSelectSchema);

export const CoursesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'BSIT' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});
