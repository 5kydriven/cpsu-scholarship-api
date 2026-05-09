import { UserRole } from '@/types/common';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
	student: 1,
	personnel: 2,
	admin: 3,
};

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean =>
	ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
