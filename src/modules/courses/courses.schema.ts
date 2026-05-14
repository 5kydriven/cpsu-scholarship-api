import { courseSelectSchema } from '@/db/schema';
import {
	CursorMetaSchema,
	CursorQuerySchema,
	OffsetMetaSchema,
	OffsetQuerySchema,
} from '@/lib/pagination';
import z from 'zod';

export const CourseParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CoursesOffsetResponseSchema = z.object({
	data: courseSelectSchema.array(),
	meta: OffsetMetaSchema,
});

export const CoursesCursorResponseSchema = z.object({
	data: courseSelectSchema.array(),
	meta: CursorMetaSchema,
});

export const CoursesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'BSIT' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const CoursesCursorQuerySchema = CursorQuerySchema;
