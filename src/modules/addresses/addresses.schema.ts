import { addresses } from '@/db/schema';
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

export const AddressesParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

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
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const AddressUpdateSchema = createUpdateSchema(
	addresses,
	addressSchemaExamples,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const AddressesOffsetResponseSchema = z.object({
	data: AddressSelectSchema.array(),
	meta: OffsetMetaSchema,
});

export const AddressesCursorResponseSchema = z.object({
	data: AddressSelectSchema.array(),
	meta: CursorMetaSchema,
});

export const AddressesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'Jl. Raya' }),
	sort: z
		.enum(['province', 'cityMunicipality', 'barangay', 'street', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const AddressesCursorQuerySchema = CursorQuerySchema;
