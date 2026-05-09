import z from 'zod';

export const CourseParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateCourseSchema = z.object({
	name: z
		.string()
		.min(2)
		.max(100)
		.openapi({ example: 'Bachelor of Science in Information Technology' }),
	abbreviation: z.string().min(3).max(20).openapi({ example: 'BSIT' }),
	major: z.string().optional().openapi({ example: 'Programming' }),
});

export const UpdateCourseSchema = z
	.object({
		name: z
			.string()
			.min(2)
			.max(100)
			.optional()
			.openapi({ example: 'Bachelor of Science in Information Technology' }),
		abbreviation: z
			.string()
			.min(3)
			.max(20)
			.optional()
			.openapi({ example: 'BSIT' }),
		major: z.string().optional().openapi({ example: 'Programming' }),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: 'At least one course field is required',
	});

export const CourseResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	abbreviation: z.string(),
	major: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const CoursesOffsetResponseSchema = z.object({
	data: CourseResponseSchema.array(),
	meta: z.object({
		total: z.number().int().min(0),
		page: z.number().int().min(1),
		perPage: z.number().int().min(1),
		totalPages: z.number().int().min(0),
		hasNext: z.boolean(),
		hasPrev: z.boolean(),
	}),
});

export const CoursesCursorResponseSchema = z.object({
	data: CourseResponseSchema.array(),
	meta: z.object({
		nextCursor: z.string().nullable(),
		prevCursor: z.string().nullable(),
		hasNext: z.boolean(),
		hasPrev: z.boolean(),
		perPage: z.number().int().min(1),
	}),
});

// Offset pagination query
export const CoursesOffsetQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
	perPage: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(20)
		.openapi({ example: 20 }),
	search: z.string().optional().openapi({ example: 'BSIT' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

// Cursor pagination query
export const CoursesCursorQuerySchema = z.object({
	cursor: z.string().optional().openapi({ example: 'eyJpZCI6ImExYjIifQ==' }),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
	direction: z.enum(['next', 'prev']).default('next'),
});
