import { env } from 'hono/adapter';
import type { Context } from 'hono';
import type { AppBindings, AppEnv } from '@/types/app';

type RuntimeEnv = AppBindings & {
	VERCEL_URL?: string;
};

const requiredEnvKeys = [
	'DATABASE_URL',
	'BETTER_AUTH_SECRET',
	'CORS_ORIGIN',
] as const;

const readEnvValue = (value: string | undefined) => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};

const withHttpsProtocol = (url: string) =>
	/^https?:\/\//i.test(url) ? url : `https://${url}`;

export const getAppEnv = (c: Context<AppEnv>): AppBindings => {
	const runtimeEnv = env<RuntimeEnv>(c);
	const databaseUrl = readEnvValue(runtimeEnv.DATABASE_URL);
	const betterAuthSecret = readEnvValue(runtimeEnv.BETTER_AUTH_SECRET);
	const corsOrigin = readEnvValue(runtimeEnv.CORS_ORIGIN);
	const resolvedValues = {
		DATABASE_URL: databaseUrl,
		BETTER_AUTH_SECRET: betterAuthSecret,
		CORS_ORIGIN: corsOrigin,
	};
	const missingKeys: string[] = requiredEnvKeys.filter(
		(key) => !resolvedValues[key],
	);

	const vercelUrl = readEnvValue(runtimeEnv.VERCEL_URL);
	const betterAuthUrl =
		readEnvValue(runtimeEnv.BETTER_AUTH_URL) ??
		(vercelUrl ? withHttpsProtocol(vercelUrl) : undefined);

	if (!betterAuthUrl) {
		missingKeys.push('BETTER_AUTH_URL');
	}

	if (missingKeys.length > 0) {
		throw new Error(`Missing environment variables: ${missingKeys.join(', ')}`);
	}

	return {
		DATABASE_URL: databaseUrl!,
		BETTER_AUTH_SECRET: betterAuthSecret!,
		BETTER_AUTH_URL: betterAuthUrl!,
		CORS_ORIGIN: corsOrigin!,
	};
};
