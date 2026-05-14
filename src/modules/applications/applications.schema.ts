import z from 'zod';

export const ApplicationsParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateApplicationFieldsSchema = z.object({
	studentId: z
		.uuid()
		.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	offeringId: z
		.uuid()
		.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	courseId: z
		.uuid()
		.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	firstName: z.string().min(2).max(50).openapi({ example: 'John' }),
	lastName: z.string().min(2).max(50).openapi({ example: 'Doe' }),
	middleName: z
		.string()
		.min(2)
		.max(50)
		.optional()
		.openapi({ example: 'Smith' }),
	extName: z.string().min(1).max(10).optional().openapi({ example: 'Jr.' }),
	gender: z.string().min(2).max(10).openapi({ example: 'Male' }),
	birthDate: z.string().min(10).max(10).openapi({ example: '1990-01-01' }),
	yearLevel: z.string().min(1).max(50).openapi({ example: '1st Year' }),
	gwa: z.string().min(1).max(5).openapi({ example: '1.75' }),
	citizenship: z.string().min(2).max(50).openapi({ example: 'Filipino' }),
	birthplace: z.string().min(2).max(100).openapi({ example: 'Tacloban City' }),
	email: z.email().openapi({ example: 'john.doe@example.com' }),
	numberOfSiblings: z.string().min(1).max(10).openapi({ example: '3' }),
	contactNumber: z.string().min(11).max(13).openapi({ example: '09123456789' }),
	schoolSector: z.string().min(2).max(50).openapi({ example: 'Public' }),
	schoolName: z
		.string()
		.min(5)
		.max(100)
		.openapi({ example: 'Central Philippine State University' }),
	schoolAddress: z
		.string()
		.min(5)
		.max(200)
		.openapi({ example: 'San Carlos City' }),
	otherFinancialAssistance: z
		.string()
		.min(2)
		.max(200)
		.openapi({ example: 'None' }),
});

export const CreateApplicationParentsSchema = z.object({
	motherVitalStatus: z
		.enum(['living', 'deceased', 'unknown'])
		.openapi({ example: 'living' }),
	motherFirstName: z.string().min(2).max(100).openapi({ example: 'Jane' }),
	motherLastName: z.string().min(2).max(100).openapi({ example: 'Doe' }),
	motherMiddleName: z
		.string()
		.min(2)
		.max(100)
		.optional()
		.openapi({ example: 'Santos' }),
	motherExtName: z.string().min(1).max(100).optional().openapi({ example: '' }),
	motherOccupation: z.string().min(2).max(100).openapi({ example: 'Teacher' }),
	motherMonthlyIncome: z.string().min(1).max(100).openapi({ example: '15000' }),
	secondParentType: z
		.enum(['father', 'guardian'])
		.openapi({ example: 'father' }),
	secondParentVitalStatus: z
		.enum(['living', 'deceased', 'unknown'])
		.openapi({ example: 'living' }),
	secondParentFirstName: z
		.string()
		.min(2)
		.max(100)
		.optional()
		.openapi({ example: 'John' }),
	secondParentLastName: z
		.string()
		.min(2)
		.max(100)
		.optional()
		.openapi({ example: 'Doe' }),
	secondParentMiddleName: z
		.string()
		.min(2)
		.max(100)
		.optional()
		.openapi({ example: 'Reyes' }),
	secondParentExtName: z
		.string()
		.min(1)
		.max(100)
		.optional()
		.openapi({ example: 'Jr.' }),
	secondParentOccupation: z
		.string()
		.min(2)
		.max(100)
		.optional()
		.openapi({ example: 'Engineer' }),
	secondParentMonthlyIncome: z
		.string()
		.min(1)
		.max(100)
		.optional()
		.openapi({ example: '20000' }),
});

const FileUploadSchema = z.any().openapi({
	type: 'string',
	format: 'binary',
	description: 'PDF, JPEG, or PNG file up to 5 MB',
});

export const CreateApplicationSchema = CreateApplicationFieldsSchema.extend({
	pwdFile: FileUploadSchema.optional(),
	ipFile: FileUploadSchema.optional(),
	fourPsFile: FileUploadSchema.optional(),
}).merge(CreateApplicationParentsSchema);

export const ApplicationSchema = z.object({
	id: z.uuid(),
	studentId: z.uuid(),
	offeringId: z.uuid(),
	courseId: z.uuid().nullable(),
	firstName: z.string(),
	lastName: z.string(),
	middleName: z.string().nullable(),
	extName: z.string().nullable(),
	gender: z.string(),
	birthdate: z.string(),
	yearLevel: z.string(),
	gwa: z.string(),
	citizenship: z.string().nullable(),
	birthplace: z.string().nullable(),
	email: z.string(),
	numberOfSiblings: z.string().nullable(),
	contactNumber: z.string(),
	schoolSector: z.string().nullable(),
	schoolName: z.string().nullable(),
	schoolAddress: z.string().nullable(),
	otherFinancialAssistance: z.string().nullable(),
	pwdUrl: z.string().nullable(),
	ipUrl: z.string().nullable(),
	fourPsUrl: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ApplicationParentResponseSchema = z.object({
	id: z.uuid(),
	applicationId: z.uuid(),
	vitalStatus: z.enum(['living', 'deceased', 'unknown']),
	type: z.enum(['mother', 'father', 'guardian']),
	firstName: z.string(),
	lastName: z.string(),
	middleName: z.string().nullable(),
	extName: z.string().nullable(),
	occupation: z.string(),
	monthlyIncome: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ApplicationWithParentsResponseSchema = z.object({
	application: ApplicationSchema,
	parents: ApplicationParentResponseSchema.array().length(2),
});

export type CreateApplicationFieldsInput = z.infer<
	typeof CreateApplicationFieldsSchema
>;
export type CreateApplicationParentsInput = z.infer<
	typeof CreateApplicationParentsSchema
>;
