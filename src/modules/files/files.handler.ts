import type { RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/app';
import type { createFileRoute } from './files.route';
import { fileValidator } from '@/utils/file_validator';

export const createFile: RouteHandler<typeof createFileRoute, AppEnv> = async (
	c,
) => {
	const body = await c.req.parseBody();
	const file = body['file'] as File;
	const uploadedFile = fileValidator(file);
	const key = `applications/${crypto.randomUUID()}-${uploadedFile.name}`;

	await c.env.R2.put(key, uploadedFile.stream(), {
		httpMetadata: {
			contentType: uploadedFile.type,
		},
	});

	return c.json({ url: `${c.env.PUBLIC_URL}/${key}` }, 201);
};
