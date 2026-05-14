import z from 'zod';
import { createSchemaFactory } from 'drizzle-zod';
import { addresses, applications, parents } from '@/db/schema';
import { courseSelectSchema } from '../courses/courses.schema';
import { parentSelectSchema } from '../parents/parents.schema';
import { ProgramOfferingResponseSchema } from '../program_offerings/program_offerings.schema';
import { AddressSelectSchema } from '../addresses/addresses.schema';

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
	createSchemaFactory({ zodInstance: z });

export const ApplicationsParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const applicationSelectSchema = createSelectSchema(applications);

const nestedAddressInsertSchema = createInsertSchema(addresses).omit({
	id: true,
	applicationId: true,
	createdAt: true,
	updatedAt: true,
});

const nestedParentInsertSchema = createInsertSchema(parents).omit({
	id: true,
	applicationId: true,
	createdAt: true,
	updatedAt: true,
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

export const applicationInsertSchema = createInsertSchema(applications, {})
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		addresses: nestedAddressInsertSchema.array().length(2).openapi({
			description: 'Exactly two address records for the application',
		}),
		parents: nestedParentInsertSchema.array().length(2).openapi({
			description: 'Exactly two parent or guardian records for the application',
		}),
	});

export type CreateApplicationInput = z.infer<typeof applicationInsertSchema>;
