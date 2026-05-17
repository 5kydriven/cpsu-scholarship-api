import { payouts } from '@/db/schema';
import { UuidIdParamsSchema } from '@/lib/common-schemas';
import { createSelectSchema } from '@/lib/drizzle-zod';
import z from 'zod';

export const PayoutParamsSchema = UuidIdParamsSchema;

export const OpenPayoutClaimsBodySchema = z.object({
	ids: z
		.uuid()
		.array()
		.min(1)
		.openapi({
			description: 'Payout IDs to open for student claiming',
			example: [
				'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
				'b2c3d4e5-f6a7-8901-bcde-f23456789012',
			],
		}),
});

export const PayoutCheckReleaseSchema = z.object({
	checkNo: z.string().min(1).max(100).openapi({
		example: 'CHK-2026-0001',
		description: 'Check number submitted by the student',
	}),
	file: z.any().openapi({
		type: 'string',
		format: 'binary',
		description: 'JPEG or PNG image of the check',
	}),
});

export const PayoutResponseSchema = createSelectSchema(payouts, {
	id: (schema) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	applicationId: (schema) =>
		schema.openapi({ example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' }),
	semester: (schema) => schema.openapi({ example: '1' }),
	amount: (schema) => schema.openapi({ example: '7000.00' }),
	status: (schema) => schema.openapi({ example: 'pending' }),
	isClaimable: (schema) => schema.openapi({ example: true }),
	claimableBy: (schema) =>
		schema.openapi({ example: 'c3d4e5f6-a7b8-9012-cdef-345678901234' }),
	claimableAt: (schema) =>
		schema.openapi({ example: '2026-05-17T12:00:00.000Z' }),
	checkNo: (schema) => schema.openapi({ example: 'CHK-2026-0001' }),
	checkImageUrl: (schema) =>
		schema.openapi({ example: 'https://cdn.example.com/payouts/check.png' }),
	releasedBy: (schema) =>
		schema.openapi({ example: 'c3d4e5f6-a7b8-9012-cdef-345678901234' }),
	releasedAt: (schema) =>
		schema.openapi({ example: '2026-05-17T12:00:00.000Z' }),
	createdAt: (schema) =>
		schema.openapi({ example: '2026-05-17T12:00:00.000Z' }),
	updatedAt: (schema) =>
		schema.openapi({ example: '2026-05-17T12:00:00.000Z' }),
});

export const PayoutsResponseSchema = z.object({
	data: PayoutResponseSchema.array(),
});
