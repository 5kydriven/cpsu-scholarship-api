import z from 'zod';

export const FileSchema = z.object({
	file: z.any().openapi({
		type: 'string',
		format: 'binary',
		description: 'PDF, JPEG, or PNG file up to 5 MB',
	}),
});

export const FileResponseSchema = z.object({
	url: z.string(),
});
