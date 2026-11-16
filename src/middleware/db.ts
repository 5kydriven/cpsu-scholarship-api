import { MiddlewareHandler } from 'hono';
import { createDbConnection } from '@/db';

export const dbMiddleware = (): MiddlewareHandler => async (c, next) => {
	const { db } = await createDbConnection(
		c.env.DATABASE_URL,
		c.env.DATABASE_DRIVER,
	);
	c.set('db', db);
	await next();
};
