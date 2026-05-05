import { Hono } from 'hono';
import { dbMiddleware } from '@/middleware/db';
import { cors } from 'hono/cors';
import { withAuth } from '@/middleware/with-auth';
import { authRoute } from '@/modules/auth/auth.route';
import { errorHandler } from '@/middleware/error-handler';
import type { AppEnv } from '@/types/app';

const app = new Hono<AppEnv>();

app.onError(errorHandler);

app.use(
	'*',
	cors({
		origin: (origin, c) => {
			const allowedOrigin = c.env.CORS_ORIGIN;

			if (!origin) return allowedOrigin;
			if (origin === allowedOrigin) return origin;

			return allowedOrigin;
		},
		allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	}),
);

app.use('*', dbMiddleware());
app.use('*', withAuth);

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

app.route('/api/v1/auth', authRoute);

export default app;
