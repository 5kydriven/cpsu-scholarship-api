import { z } from '@hono/zod-openapi';
import { USER_ROLES } from '@/constants/roles';
import { student } from '@/db/schema';
import { createSelectSchema } from '@/lib/drizzle-zod';
import { StaffProfileSelectSchema } from '@/modules/staff_profiles/staff_profiles.schema';

export const RegisterSchema = z.object({
	name: z.string().min(1).max(100).openapi({ example: 'Maria Santos' }),
	email: z.email().openapi({ example: 'maria@example.com' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
});

export const LoginSchema = z.object({
	email: z.email().openapi({ example: 'maria@example.com' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
});

export const StudentVerifyQuerySchema = z.object({
	studentNumber: z.string().min(1).openapi({ example: '2025-0015-R' }),
});

export const StudentRegisterSchema = z.object({
	studentNumber: z.string().min(1).openapi({ example: '2025-0015-R' }),
	email: z.email().openapi({ example: 'student@example.com' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
});

export const StudentLoginSchema = z.object({
	studentNumber: z.string().min(1).openapi({ example: '2025-0015-R' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
});

export const AuthUserSchema = z.object({
	id: z.string().openapi({ example: 'user_123' }),
	name: z.string().openapi({ example: 'Maria Santos' }),
	email: z.email().openapi({ example: 'maria@example.com' }),
	role: z.enum(USER_ROLES).openapi({
		example: 'student',
	}),
});

export const AuthResponseSchema = z.object({
	user: AuthUserSchema,
});

export const StudentAuthProfileSchema = z.object({
	studentNumber: z.string().openapi({ example: '2025-0015-R' }),
	name: z.string().nullable().openapi({ example: 'ABELO, JANEL' }),
	email: z.email().optional().openapi({ example: 'student@example.com' }),
});

export const StudentProfileSchema = createSelectSchema(student, {
	id: (schema) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	userId: (schema) => schema.openapi({ example: 'user_123' }),
	studentNumber: (schema) => schema.openapi({ example: '2025-0015-R' }),
	name: (schema) => schema.openapi({ example: 'ABELO, JANEL' }),
	firstName: (schema) => schema.openapi({ example: 'Janel' }),
	lastName: (schema) => schema.openapi({ example: 'Abelo' }),
	middleName: (schema) => schema.openapi({ example: 'Reyes' }),
	extName: (schema) => schema.openapi({ example: 'Jr.' }),
	courseId: (schema) =>
		schema.openapi({ example: 'd4e5f6a7-b8c9-0123-defa-456789012345' }),
	email: (schema) => schema.openapi({ example: 'student@example.com' }),
	isScholar: (schema) => schema.openapi({ example: false }),
	createdAt: (schema) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: (schema) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
});

export const StudentAuthResponseSchema = z.object({
	user: AuthUserSchema,
	student: StudentProfileSchema,
});

export const StudentVerifyResponseSchema = z.object({
	allowed: z.boolean().openapi({ example: true }),
	isRegistered: z.boolean().openapi({ example: false }),
	nextAction: z.enum(['denied', 'register', 'login']).openapi({
		example: 'register',
	}),
	student: StudentAuthProfileSchema.omit({ email: true }).nullable(),
});

export const SessionResponseSchema = z.object({
	id: z.string().openapi({ example: 'session_123' }),
	userId: z.string().openapi({ example: 'user_123' }),
	expiresAt: z.string().openapi({ example: '2026-05-05T12:00:00.000Z' }),
});

export const MeResponseSchema = z.object({
	user: AuthUserSchema,
	session: SessionResponseSchema,
	student: StudentProfileSchema.nullable(),
	staff: StaffProfileSelectSchema.nullable(),
});

export const LogoutResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
});
