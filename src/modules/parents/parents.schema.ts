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

export const parentSchemaExamples = {
	id: (schema: any) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	applicationId: (schema: any) =>
		schema.openapi({ example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' }),
	vitalStatus: (schema: any) => schema.openapi({ example: 'living' }),
	type: (schema: any) => schema.openapi({ example: 'father' }),
	firstName: (schema: any) => schema.openapi({ example: 'Juan' }),
	lastName: (schema: any) => schema.openapi({ example: 'Dela Cruz' }),
	middleName: (schema: any) => schema.openapi({ example: 'Santos' }),
	extName: (schema: any) => schema.openapi({ example: 'Jr.' }),
	occupation: (schema: any) => schema.openapi({ example: 'Farmer' }),
	monthlyIncome: (schema: any) => schema.openapi({ example: '15000' }),
	createdAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
};

export const parentSelectSchema = createSelectSchema(parents, parentSchemaExamples);

export const parentInsertSchema = createInsertSchema(
	parents,
	parentSchemaExamples,
).omit({
	updatedAt: true,
	createdAt: true,
	id: true,
});

export const parentUpdateSchema = createUpdateSchema(
	parents,
	parentSchemaExamples,
).omit({
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
