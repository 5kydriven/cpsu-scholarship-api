import { programOfferings } from '@/db/schema';
import { OffsetQuerySchema } from '@/lib/pagination';
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

export const ProgramOfferingParamsSchema = UuidIdParamsSchema;

const positiveMoneySchema = z
	.string()
	.refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
		message: 'Must be greater than 0',
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
		amountPerSemester: (schema) => schema.openapi({ example: '7000.00' }),
		pwdAdditional: (schema) => schema.openapi({ example: '2000.00' }),
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
	amountPerSemester: (schema) => schema.openapi({ example: '7000.00' }),
	pwdAdditional: (schema) => schema.openapi({ example: '2000.00' }),
	isActive: (schema) => schema.openapi({ example: true }),
	isArchived: (schema) => schema.openapi({ example: false }),
})
	.omit({
		...generatedFields,
		isActive: true,
		isArchived: true,
	})
	.extend({
		totalBudget: positiveMoneySchema.openapi({ example: '1000000.00' }),
		amountPerSemester: positiveMoneySchema.openapi({ example: '7000.00' }),
		pwdAdditional: positiveMoneySchema.openapi({ example: '2000.00' }),
	});

export const UpdateProgramOfferingSchema = createUpdateSchema(programOfferings, {
	scholarshipProgramId: (schema) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	schoolYear: (schema) => schema.max(20).openapi({ example: '2023 - 2024' }),
	totalBudget: (schema) => schema.openapi({ example: '1000000.00' }),
	amountPerSemester: (schema) => schema.openapi({ example: '7000.00' }),
	pwdAdditional: (schema) => schema.openapi({ example: '2000.00' }),
	isActive: (schema) => schema.openapi({ example: true }),
	isArchived: (schema) => schema.openapi({ example: false }),
})
	.omit({
		...generatedFields,
	})
	.extend({
		totalBudget: positiveMoneySchema.optional().openapi({
			example: '1000000.00',
		}),
		amountPerSemester: positiveMoneySchema.optional().openapi({
			example: '7000.00',
		}),
		pwdAdditional: positiveMoneySchema.optional().openapi({
			example: '2000.00',
		}),
	})
	.refine(
		(value) => Object.keys(value).length > 0,
		{
			message: 'At least one program offering field is required',
		},
	);

export const ProgramOfferingsOffsetResponseSchema =
	createOffsetResponseSchema(ProgramOfferingResponseSchema);

export const ProgramOfferingsCursorResponseSchema =
	createCursorResponseSchema(ProgramOfferingResponseSchema);

export const ProgramOfferingsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'TES' }),
	sort: z
		.enum(['schoolYear', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});
