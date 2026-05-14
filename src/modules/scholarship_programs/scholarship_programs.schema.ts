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

export const ScholarshipProgramSelectSchema =
	createSelectSchema(scholarshipPrograms);

export const ScholarshipProgramInsertSchema = createInsertSchema(
	scholarshipPrograms,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const ScholarshipProgramUpdateSchema = createUpdateSchema(
	scholarshipPrograms,
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
