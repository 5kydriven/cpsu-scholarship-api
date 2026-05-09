import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv, UserRole } from '../types/app';

const roleRank: Record<UserRole, number> = {
	student: 1,
	personnel: 2,
	admin: 3,
};

export const requireRole = (
	minimumRole: UserRole,
): MiddlewareHandler<AppEnv> => {
	return async (c, next) => {
		const user = c.get('user');

		if (!user) {
			throw new HTTPException(401, {
				message: 'Unauthorized',
			});
		}

		if (roleRank[user.role] < roleRank[minimumRole]) {
			throw new HTTPException(403, {
				message: `Insufficient role. Required: ${minimumRole}`,
			});
		}

		await next();
	};
};
