import z from 'zod';
import { USER_ROLES } from '@/constants/roles';
import { UuidIdParamsSchema } from '@/lib/common-schemas';
import { applicationWithRelationsSchema } from '../applications/applications.schema';

export const EligibilitySuggestionRunParamsSchema = UuidIdParamsSchema.extend({
	runId: z.uuid().openapi({
		example: 'd4e5f6a7-b8c9-0123-defa-456789012345',
	}),
});

export const EligibilityCriteriaSnapshotSchema = z.object({
	maxGwa: z.number().openapi({ example: 2.5 }),
	maxAnnualFamilyIncomeExclusive: z.number().openapi({ example: 100000 }),
	priorityProofs: z
		.string()
		.array()
		.openapi({ example: ['fourPsUrl', 'ipUrl', 'pwdUrl'] }),
	rankingOrder: z.string().array().openapi({
		example: [
			'priorityProofs desc',
			'annualFamilyIncome asc',
			'gwa asc',
			'createdAt asc',
		],
	}),
});

export const EligibilitySuggestionRunSchema = z.object({
	id: z.uuid().openapi({
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
	}),
	offeringId: z.uuid().openapi({
		example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
	}),
	generatedBy: z.string().openapi({ example: 'user_123' }),
	generatedAt: z.string().openapi({ example: '2026-05-15T14:30:00.000Z' }),
	criteriaSnapshot: EligibilityCriteriaSnapshotSchema,
	suggestedCount: z.number().int().openapi({ example: 25 }),
});

export const EligibilitySuggestionGeneratedByUserSchema = z
	.object({
		id: z.string().openapi({ example: 'user_123' }),
		name: z.string().openapi({ example: 'Admin User' }),
		email: z.email().openapi({ example: 'admin@example.com' }),
		role: z.enum(USER_ROLES).openapi({ example: 'personnel' }),
	})
	.nullable();

export const EligibilitySuggestionSchema = z.object({
	rank: z.number().int().positive().openapi({ example: 1 }),
	application: applicationWithRelationsSchema,
	gwa: z.number().openapi({ example: 1.75 }),
	annualFamilyIncome: z.number().openapi({ example: 84000 }),
	priorityProofs: z
		.string()
		.array()
		.openapi({ example: ['fourPsUrl'] }),
});

export const EligibilitySuggestionRunDetailResponseSchema = z.object({
	run: EligibilitySuggestionRunSchema,
	generatedByUser: EligibilitySuggestionGeneratedByUserSchema,
	suggestions: EligibilitySuggestionSchema.array(),
});

export const EligibilitySuggestionRunsResponseSchema = z.object({
	data: z
		.object({
			run: EligibilitySuggestionRunSchema,
			generatedByUser: EligibilitySuggestionGeneratedByUserSchema,
		})
		.array(),
});
