import { parents } from '@/db/schema';
import {
	CursorMetaSchema,
	CursorQuerySchema,
	OffsetMetaSchema,
	OffsetQuerySchema,
} from '@/lib/pagination';
import { createSchemaFactory } from 'drizzle-zod';
import z from 'zod';

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
	createSchemaFactory({ zodInstance: z });

export const ParentParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const parentSelectSchema = createSelectSchema(parents);

export const parentInsertSchema = createInsertSchema(parents).omit({
	updatedAt: true,
	createdAt: true,
	id: true,
});

export const parentUpdateSchema = createUpdateSchema(parents).omit({
	updatedAt: true,
	createdAt: true,
	id: true,
});

export const ParentsOffsetResponseSchema = z.object({
	data: parentSelectSchema.array(),
	meta: OffsetMetaSchema,
});

export const ParentsCursorResponseSchema = z.object({
	data: parentSelectSchema.array(),
	meta: CursorMetaSchema,
});

export const ParentsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'John' }),
	sort: z
		.enum(['firstName', 'lastName', 'middleName', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const ParentsCursorQuerySchema = CursorQuerySchema;
