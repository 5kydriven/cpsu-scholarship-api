import { staffProfile } from '@/db/schema';
import {
	CursorMetaSchema,
	CursorQuerySchema,
	OffsetMetaSchema,
	OffsetQuerySchema,
} from '@/lib/pagination';
import { createSchemaFactory } from 'drizzle-zod';
import z from 'zod';

export const StaffProfileParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
	createSchemaFactory({ zodInstance: z });

export const StaffProfileSelectSchema = createSelectSchema(staffProfile, {
	id: (schema) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	userId: (schema) => schema.openapi({ example: 'user_123' }),
	firstName: (schema) => schema.openapi({ example: 'Juan' }),
	lastName: (schema) => schema.openapi({ example: 'Dela Cruz' }),
	department: (schema) => schema.openapi({ example: 'Registrar' }),
	position: (schema) => schema.openapi({ example: 'Records Officer' }),
	contactNumber: (schema) => schema.openapi({ example: '+639171234567' }),
	createdAt: (schema) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: (schema) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
});

export const StaffProfileInsertSchema = createInsertSchema(staffProfile, {
	firstName: (schema) => schema.min(1).max(100).openapi({ example: 'Juan' }),
	lastName: (schema) =>
		schema.min(1).max(100).openapi({ example: 'Dela Cruz' }),
	department: (schema) =>
		schema.min(1).max(100).openapi({ example: 'Registrar' }),
	position: (schema) =>
		schema.min(1).max(100).openapi({ example: 'Records Officer' }),
	contactNumber: (schema) =>
		schema.min(1).max(50).openapi({ example: '+639171234567' }),
}).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
});

export const StaffProfileUpdateSchema = createUpdateSchema(staffProfile, {
	firstName: (schema) => schema.min(1).max(100).openapi({ example: 'Juan' }),
	lastName: (schema) =>
		schema.min(1).max(100).openapi({ example: 'Dela Cruz' }),
	department: (schema) =>
		schema.min(1).max(100).openapi({ example: 'Registrar' }),
	position: (schema) =>
		schema.min(1).max(100).openapi({ example: 'Records Officer' }),
	contactNumber: (schema) =>
		schema.min(1).max(50).openapi({ example: '+639171234567' }),
}).omit({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
});

export const CreateStaffProfileSchema = StaffProfileInsertSchema.extend({
	email: z.email().openapi({ example: 'juan.staff@example.com' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
});

export const StaffProfileUserSchema = z.object({
	id: z.string().openapi({ example: 'user_123' }),
	name: z.string().openapi({ example: 'Juan Dela Cruz' }),
	email: z.email().openapi({ example: 'juan.staff@example.com' }),
	role: z.literal('personnel').openapi({ example: 'personnel' }),
});

export const StaffProfileSchema = StaffProfileSelectSchema.extend({
	role: z
		.enum(['admin', 'personnel', 'student'])
		.openapi({ example: 'personnel' }),
});

export const StaffProfilesOffsetResponseSchema = z.object({
	data: StaffProfileSchema.array(),
	meta: OffsetMetaSchema,
});

export const StaffProfilesCursorResponseSchema = z.object({
	data: StaffProfileSchema.array(),
	meta: CursorMetaSchema,
});

export const StaffProfilesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'Juan' }),
	sort: z
		.enum(['firstName', 'lastName', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const StaffProfilesCursorQuerySchema = CursorQuerySchema;

export const UpdateStaffProfileSchema = StaffProfileUpdateSchema.refine(
	(value) => Object.keys(value).length > 0,
	{
		message: 'At least one staff profile field is required',
	},
);

export type CreateStaffProfileInput = z.infer<typeof CreateStaffProfileSchema>;
export type UpdateStaffProfileInput = z.infer<typeof UpdateStaffProfileSchema>;
