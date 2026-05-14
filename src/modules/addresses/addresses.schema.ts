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

export const AddressSelectSchema = createSelectSchema(addresses);

export const AddressInsertSchema = createInsertSchema(addresses).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const AddressUpdateSchema = createUpdateSchema(addresses).omit({
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
