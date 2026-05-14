import { programOfferings } from '@/db/schema';
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

export const ProgramOfferingParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const ProgramOfferingResponseSchema = createSelectSchema(
	programOfferings,
	{
		id: (schema) =>
			schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
		scholarshipProgramId: (schema) =>
			schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
		schoolYear: (schema) =>
			schema.max(20).openapi({ example: '2023 - 2024' }),
		totalBudget: (schema) => schema.openapi({ example: '1000000.00' }),
		isActive: (schema) => schema.openapi({ example: true }),
		isArchived: (schema) => schema.openapi({ example: false }),
		createdAt: (schema) =>
			schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
		updatedAt: (schema) =>
			schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	},
);

export const CreateProgramOfferingSchema = createInsertSchema(programOfferings, {
	scholarshipProgramId: (schema) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	schoolYear: (schema) => schema.max(20).openapi({ example: '2023 - 2024' }),
	totalBudget: (schema) => schema.openapi({ example: '1000000.00' }),
	isActive: (schema) => schema.openapi({ example: true }),
	isArchived: (schema) => schema.openapi({ example: false }),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateProgramOfferingSchema = createUpdateSchema(programOfferings, {
	scholarshipProgramId: (schema) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	schoolYear: (schema) => schema.max(20).openapi({ example: '2023 - 2024' }),
	totalBudget: (schema) => schema.openapi({ example: '1000000.00' }),
	isActive: (schema) => schema.openapi({ example: true }),
	isArchived: (schema) => schema.openapi({ example: false }),
})
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.refine(
		(value) => Object.keys(value).length > 0,
		{
			message: 'At least one program offering field is required',
		},
	);

export const ProgramOfferingsOffsetResponseSchema = z.object({
	data: ProgramOfferingResponseSchema.array(),
	meta: OffsetMetaSchema,
});

export const ProgramOfferingsCursorResponseSchema = z.object({
	data: ProgramOfferingResponseSchema.array(),
	meta: CursorMetaSchema,
});

export const ProgramOfferingsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'TES' }),
	sort: z
		.enum(['schoolYear', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const ProgramOfferingsCursorQuerySchema = CursorQuerySchema;
