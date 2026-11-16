import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { parseCorsOrigins } from './cors-origins';
import type { Db } from '../db';
import type { AppBindings } from '../types/app';
import { account, session, user, verification } from '../db/schema/auth';
import { hashPassword, verifyPassword } from '../utils/crypto';

export const createAuth = (
	db: Db,
	env: Pick<AppBindings, 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL' | 'CORS_ORIGIN'>,
) => {
	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,

		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				user,
				session,
				account,
				verification,
			},
		}),

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			autoSignIn: false,
			password: {
				hash: hashPassword,
				verify: async ({ hash, password }) => verifyPassword(hash, password),
			},
		},

		user: {
			additionalFields: {
				role: {
					type: 'string',
					required: false,
					defaultValue: 'student',
					input: false,
				},
			},
		},

		trustedOrigins: parseCorsOrigins(env.CORS_ORIGIN),
	});
};

export type Auth = ReturnType<typeof createAuth>;
