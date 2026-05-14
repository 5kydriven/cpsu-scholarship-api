import type { RouteHandler } from '@hono/zod-openapi';
import type { Context, Handler } from 'hono';
import { Errors } from '@/lib/errors';
import type { AppEnv } from '@/types/app';
import type { createFileRoute } from './files.route';

const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedFileTypes = new Set([
	'application/pdf',
	'image/jpeg',
	'image/png',
]);

const isUploadedFile = (value: unknown): value is File =>
	typeof value === 'object' &&
	value !== null &&
	'name' in value &&
	'size' in value &&
	'type' in value &&
	'arrayBuffer' in value &&
	typeof (value as { arrayBuffer: unknown }).arrayBuffer === 'function';

const validateUploadedFile = (value: unknown) => {
	if (!isUploadedFile(value)) {
		throw Errors.validation([
			{ field: 'file', message: 'A PDF, JPEG, or PNG file is required' },
		]);
	}

	if (value.size === 0) {
		throw Errors.validation([{ field: 'file', message: 'File is required' }]);
	}

	if (value.size > maxFileSizeBytes) {
		throw Errors.validation([
			{ field: 'file', message: 'File must be 5 MB or smaller' },
		]);
	}

	if (!allowedFileTypes.has(value.type)) {
		throw Errors.validation([
			{ field: 'file', message: 'Only PDF, JPEG, and PNG files are allowed' },
		]);
	}

	return value;
};

export const createFile: RouteHandler<typeof createFileRoute, AppEnv> = async (
	c,
) => {
	const body = await c.req.parseBody();
	const file = body['file'] as File;
	const uploadedFile = validateUploadedFile(file);
	const key = `applications/${crypto.randomUUID()}-${file.name}`;

	await c.env.R2.put(key, file.stream(), {
		httpMetadata: {
			contentType: file.type,
		},
	});

	return c.json({ url: `${c.env.PUBLIC_URL}/${key}` }, 201);
};
