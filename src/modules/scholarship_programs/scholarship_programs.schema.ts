import { scholarshipPrograms } from '@/db/schema';
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

export const ScholarshipProgramParamsSchema = UuidIdParamsSchema;

const scholarshipProgramSchemaExamples = {
	id: (schema: any) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	name: (schema: any) =>
		schema.openapi({ example: 'Tertiary Education Subsidy' }),
	description: (schema: any) =>
		schema.openapi({ example: 'Financial assistance for eligible students' }),
	isArchived: (schema: any) => schema.openapi({ example: false }),
	createdAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
};

export const ScholarshipProgramSelectSchema = createSelectSchema(
	scholarshipPrograms,
	scholarshipProgramSchemaExamples,
);

export const ScholarshipProgramInsertSchema = createInsertSchema(
	scholarshipPrograms,
	scholarshipProgramSchemaExamples,
).omit({
	...generatedFields,
});

export const ScholarshipProgramUpdateSchema = createUpdateSchema(
	scholarshipPrograms,
	scholarshipProgramSchemaExamples,
).omit({
	...generatedFields,
});

export const ScholarshipProgramsOffsetResponseSchema =
	createOffsetResponseSchema(ScholarshipProgramSelectSchema);

export const ScholarshipProgramsCursorResponseSchema =
	createCursorResponseSchema(ScholarshipProgramSelectSchema);

export const ScholarshipProgramsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'TES' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});
