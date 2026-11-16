import type { Db } from '@/db';
import type { Auth } from '../lib/auth';
import type { UserRole } from '@/constants/roles';

export type ObjectStorage = {
	put(
		key: string,
		value: unknown,
		options?: {
			httpMetadata?: {
				contentType?: string;
			};
		},
	): Promise<unknown>;
};

export type AiClient = {
	run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

export type AppBindings = {
	DATABASE_URL: string;
	DATABASE_DRIVER?: 'neon-http' | 'pg';
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
	R2: ObjectStorage;
	PUBLIC_URL: string;
	AI: AiClient;
};

export type AppVariables = {
	db: Db;
	auth: Auth;
	user: {
		id: string;
		email: string;
		name: string;
		role: UserRole;
	} | null;
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	} | null;
};

export type AppEnv = {
	Bindings: AppBindings;
	Variables: AppVariables;
};

export type { UserRole };