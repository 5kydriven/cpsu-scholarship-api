import { createDbConnection } from '@/db';
import { getAppEnv } from '@/lib/env';
import type { MiddlewareHandler } from 'hono';

export const dbMiddleware = (): MiddlewareHandler => async (c, next) => {
	const { DATABASE_URL } = getAppEnv(c);
	const { db, dispose } = await createDbConnection(DATABASE_URL);
	c.set('db', db);

	try {
		await next();
	} finally {
		await dispose?.();
	}
};
