import { addresses } from '@/db/schema';
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

export const AddressesParamsSchema = UuidIdParamsSchema;

export const addressSchemaExamples = {
	id: (schema: any) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	applicationId: (schema: any) =>
		schema.openapi({ example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' }),
	type: (schema: any) => schema.openapi({ example: 'permanent' }),
	province: (schema: any) => schema.openapi({ example: 'Negros Occidental' }),
	cityMunicipality: (schema: any) =>
		schema.openapi({ example: 'San Carlos City' }),
	barangay: (schema: any) => schema.openapi({ example: 'Barangay V' }),
	street: (schema: any) => schema.openapi({ example: 'Ylagan Extension' }),
	zipCode: (schema: any) => schema.openapi({ example: '6127' }),
	createdAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
};

export const AddressSelectSchema = createSelectSchema(
	addresses,
	addressSchemaExamples,
);

export const AddressInsertSchema = createInsertSchema(
	addresses,
	addressSchemaExamples,
).omit({
	...generatedFields,
});

export const AddressUpdateSchema = createUpdateSchema(
	addresses,
	addressSchemaExamples,
).omit({
	...generatedFields,
});

export const AddressesOffsetResponseSchema =
	createOffsetResponseSchema(AddressSelectSchema);

export const AddressesCursorResponseSchema =
	createCursorResponseSchema(AddressSelectSchema);

export const AddressesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'Jl. Raya' }),
	sort: z
		.enum(['province', 'cityMunicipality', 'barangay', 'street', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});
