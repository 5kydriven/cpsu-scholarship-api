import app from './index';
import { createR2S3Bucket, createR2S3Client } from './runtime/r2-s3';
import { createWorkersAiClient } from './runtime/workers-ai';
import type { AppBindings } from './types/app';

const requireEnv = (name: string): string => {
	const rawValue = process.env[name]?.trim();
	if (!rawValue) throw new Error(`${name} is required`);

	const hasMatchingQuotes =
		(rawValue.startsWith('"') && rawValue.endsWith('"')) ||
		(rawValue.startsWith("'") && rawValue.endsWith("'"));

	return hasMatchingQuotes ? rawValue.slice(1, -1) : rawValue;
};

const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
const r2Client = await createR2S3Client({
	endpoint:
		process.env.R2_ENDPOINT ??
		`https://${accountId}.r2.cloudflarestorage.com`,
	accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
	secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
});

const bindings = {
	DATABASE_URL: requireEnv('DATABASE_URL'),
	DATABASE_DRIVER: 'pg',
	BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET'),
	BETTER_AUTH_URL: requireEnv('BETTER_AUTH_URL'),
	CORS_ORIGIN: requireEnv('CORS_ORIGIN'),
	PUBLIC_URL: requireEnv('PUBLIC_URL'),
	R2: createR2S3Bucket({
		client: r2Client,
		bucketName: requireEnv('R2_BUCKET'),
	}),
	AI: createWorkersAiClient({
		accountId,
		apiToken: requireEnv('CLOUDFLARE_AI_API_TOKEN'),
	}),
} satisfies AppBindings;

const port = Number(process.env.PORT ?? 3000);

console.log(`CPSU Scholarship API listening on port ${port}`);

export default {
	hostname: process.env.HOST ?? '0.0.0.0',
	port,
	fetch: (request: Request) => app.fetch(request, bindings),
};
