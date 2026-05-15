import type { ZodType } from 'zod';

export const jsonContent = <Schema extends ZodType>(schema: Schema) => ({
	'application/json': { schema },
});

export const jsonBody = <Schema extends ZodType>(schema: Schema) => ({
	content: jsonContent(schema),
	required: true,
});

export const jsonOk = <Schema extends ZodType>(schema: Schema) => ({
	content: jsonContent(schema),
	description: 'OK',
});

export const jsonCreated = <Schema extends ZodType>(schema: Schema) => ({
	content: jsonContent(schema),
	description: 'Created',
});

export const deletedNoContent = {
	description: 'Deleted',
} as const;
