import z, { type ZodType } from 'zod';
import { CursorMetaSchema, OffsetMetaSchema } from './pagination';

export const UuidIdParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const createOffsetResponseSchema = <Schema extends ZodType>(
	itemSchema: Schema,
) =>
	z.object({
		data: z.array(itemSchema),
		meta: OffsetMetaSchema,
	});

export const createCursorResponseSchema = <Schema extends ZodType>(
	itemSchema: Schema,
) =>
	z.object({
		data: z.array(itemSchema),
		meta: CursorMetaSchema,
	});

export const generatedFields = {
	id: true,
	createdAt: true,
	updatedAt: true,
} as const;

export const generatedUserOwnedFields = {
	...generatedFields,
	userId: true,
} as const;
