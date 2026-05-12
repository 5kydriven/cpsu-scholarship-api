import {
	OffsetMetaSchema,
	CursorMetaSchema,
	OffsetQuerySchema,
	CursorQuerySchema,
} from '@/lib/pagination';
import z from 'zod';

export const studentAllowlistsParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateStudentAllowlistsSchema = z.object({
	name: z.string().min(2).openapi({ example: 'Dela Cruz, John' }),
	studentNumber: z.string().min(1).openapi({ example: '2025-0015-R' }),
});

export const StudentAllowlistsResponseSchema = z.object({
	id: z.uuid(),
	studentNumber: z.string(),
	name: z.string().nullable(),
	isRegistered: z.boolean(),
	uploadedBy: z.string().nullable(),
	registeredUserId: z.string().nullable(),
	registeredAt: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const StudentAllowlistImportBodySchema = z.object({
	file: z.any().openapi({
		type: 'string',
		format: 'binary',
		description: 'CSV, XLS, or XLSX file with Student ID No. and Name columns',
	}),
});

export const StudentAllowlistImportErrorSchema = z.object({
	row: z.number().int().openapi({ example: 4 }),
	message: z.string().openapi({ example: 'Missing Name' }),
});

export const StudentAllowlistImportResponseSchema = z.object({
	totalRows: z.number().int().openapi({ example: 851 }),
	inserted: z.number().int().openapi({ example: 840 }),
	skipped: z.number().int().openapi({ example: 8 }),
	invalid: z.number().int().openapi({ example: 3 }),
	errors: StudentAllowlistImportErrorSchema.array(),
});

export const StudentAllowlistVerifyQuerySchema = z.object({
	studentNumber: z.string().min(1).openapi({ example: '2025-0015-R' }),
});

export const StudentAllowlistVerifyResponseSchema = z.object({
	allowed: z.boolean().openapi({ example: true }),
	isRegistered: z.boolean().openapi({ example: false }),
	student: z
		.object({
			studentNumber: z.string().openapi({ example: '2025-0015-R' }),
			name: z.string().nullable().openapi({ example: 'ABELO, JANEL' }),
		})
		.nullable(),
});

export const StudentAllowlistsOffsetResponseSchema = z.object({
	data: StudentAllowlistsResponseSchema.array(),
	meta: OffsetMetaSchema,
});

export const StudentAllowlistsCursorResponseSchema = z.object({
	data: StudentAllowlistsResponseSchema.array(),
	meta: CursorMetaSchema,
});

export const StudentAllowlistsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'Juan' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const StudentAllowlistsCursorQuerySchema = CursorQuerySchema;
