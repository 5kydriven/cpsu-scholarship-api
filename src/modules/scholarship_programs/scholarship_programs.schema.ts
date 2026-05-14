import { scholarshipPrograms } from '@/db/schema';
import {
	OffsetMetaSchema,
	CursorMetaSchema,
	OffsetQuerySchema,
	CursorQuerySchema,
} from '@/lib/pagination';
import { createSchemaFactory } from 'drizzle-zod';
import z from 'zod';

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
	createSchemaFactory({ zodInstance: z });

export const ScholarshipProgramParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

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
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const ScholarshipProgramUpdateSchema = createUpdateSchema(
	scholarshipPrograms,
	scholarshipProgramSchemaExamples,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const ScholarshipProgramsOffsetResponseSchema = z.object({
	data: ScholarshipProgramSelectSchema.array(),
	meta: OffsetMetaSchema,
});

export const ScholarshipProgramsCursorResponseSchema = z.object({
	data: ScholarshipProgramSelectSchema.array(),
	meta: CursorMetaSchema,
});

export const ScholarshipProgramsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'TES' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const ScholarshipProgramsCursorQuerySchema = CursorQuerySchema;
