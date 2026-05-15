import z from 'zod';
import { applications } from '@/db/schema';
import { courseSelectSchema } from '../courses/courses.schema';
import {
	parentInsertSchema,
	parentSelectSchema,
} from '../parents/parents.schema';
import { ProgramOfferingResponseSchema } from '../program_offerings/program_offerings.schema';
import {
	AddressInsertSchema,
	AddressSelectSchema,
} from '../addresses/addresses.schema';
import {
	createCursorResponseSchema,
	createOffsetResponseSchema,
	generatedFields,
	UuidIdParamsSchema,
} from '@/lib/common-schemas';
import { createInsertSchema, createSelectSchema } from '@/lib/drizzle-zod';
import { OffsetQuerySchema } from '@/lib/pagination';

export const ApplicationsParamsSchema = UuidIdParamsSchema;

export const acceptApplicationsBodySchema = z.object({
	ids: z
		.uuid()
		.array()
		.min(1)
		.openapi({
			description: 'Application IDs to accept',
			example: [
				'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
				'b2c3d4e5-f6a7-8901-bcde-f23456789012',
			],
		}),
});

const applicationSchemaExamples = {
	id: (schema: any) =>
		schema.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	studentId: (schema: any) =>
		schema.openapi({ example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' }),
	offeringId: (schema: any) =>
		schema.openapi({ example: 'c3d4e5f6-a7b8-9012-cdef-345678901234' }),
	courseId: (schema: any) =>
		schema.openapi({ example: 'd4e5f6a7-b8c9-0123-defa-456789012345' }),
	firstName: (schema: any) => schema.openapi({ example: 'Maria' }),
	lastName: (schema: any) => schema.openapi({ example: 'Santos' }),
	middleName: (schema: any) => schema.openapi({ example: 'Reyes' }),
	extName: (schema: any) => schema.openapi({ example: 'Jr.' }),
	gender: (schema: any) => schema.openapi({ example: 'female' }),
	birthdate: (schema: any) => schema.openapi({ example: '2005-08-14' }),
	yearLevel: (schema: any) => schema.openapi({ example: '2nd Year' }),
	gwa: (schema: any) => schema.openapi({ example: '1.75' }),
	citizenship: (schema: any) => schema.openapi({ example: 'Filipino' }),
	birthplace: (schema: any) => schema.openapi({ example: 'San Carlos City' }),
	email: (schema: any) =>
		schema.openapi({ example: 'maria.santos@example.com' }),
	numberOfSiblings: (schema: any) => schema.openapi({ example: '3' }),
	contactNumber: (schema: any) => schema.openapi({ example: '+639171234567' }),
	schoolSector: (schema: any) => schema.openapi({ example: 'public' }),
	status: (schema: any) => schema.openapi({ example: 'pending' }),
	schoolName: (schema: any) =>
		schema.openapi({ example: 'Central Philippines State University' }),
	schoolAddress: (schema: any) =>
		schema.openapi({ example: 'San Carlos City, Negros Occidental' }),
	otherFinancialAssistance: (schema: any) =>
		schema.openapi({ example: 'Barangay scholarship' }),
	pwdUrl: (schema: any) =>
		schema.openapi({ example: 'applications/a1b2c3/pwd-certificate.pdf' }),
	ipUrl: (schema: any) =>
		schema.openapi({ example: 'applications/a1b2c3/ip-certificate.pdf' }),
	fourPsUrl: (schema: any) =>
		schema.openapi({ example: 'applications/a1b2c3/fourps-certificate.pdf' }),
	createdAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: (schema: any) =>
		schema.openapi({ example: '2026-05-09T12:00:00.000Z' }),
};

export const applicationSelectSchema = createSelectSchema(
	applications,
	applicationSchemaExamples,
);

const applicationAddressInputSchema = AddressInsertSchema.omit({
	applicationId: true,
});

const applicationParentInputSchema = parentInsertSchema.omit({
	applicationId: true,
});

export const applicationWithRelationsSchema = applicationSelectSchema
	.extend({
		addresses: AddressSelectSchema.array(),
		parents: parentSelectSchema.array(),
		offering: ProgramOfferingResponseSchema,
		course: courseSelectSchema.nullable(),
	})
	.omit({
		offeringId: true,
		courseId: true,
	});

export const acceptApplicationsResponseSchema = z.object({
	data: applicationWithRelationsSchema.array(),
});

export const ApplicationsOffsetResponseSchema =
	createOffsetResponseSchema(applicationWithRelationsSchema);

export const ApplicationsCursorResponseSchema =
	createCursorResponseSchema(applicationWithRelationsSchema);

export const ApplicationsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'Maria Santos' }),
	sort: z
		.enum(['firstName', 'lastName', 'middleName', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const applicationInsertSchema = createInsertSchema(
	applications,
	applicationSchemaExamples,
)
	.omit({
		...generatedFields,
		status: true,
		reviewedBy: true,
		reviewedAt: true,
	})
	.extend({
		addresses: applicationAddressInputSchema.array().min(1).max(2).openapi({
			description:
				'At least one and at most two address records are required for the application',
		}),
		parents: applicationParentInputSchema.array().min(1).max(2).openapi({
			description:
				'At least one and at most two parent or guardian records are required for the application',
		}),
	});

export type CreateApplicationInput = z.infer<typeof applicationInsertSchema>;
