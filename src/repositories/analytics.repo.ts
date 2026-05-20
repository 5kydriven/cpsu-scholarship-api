import type { Db } from '@/db';
import { applications, student, studentAllowlist } from '@/db/schema';
import { count, eq } from 'drizzle-orm';

const toCount = (rows: { value: number | string | bigint }[]) =>
	Number(rows[0]?.value ?? 0);

export const createAnalyticsRepo = (db: Db) => ({
	countStudents: async () =>
		toCount(await db.select({ value: count() }).from(student)),

	countApprovedScholars: async () =>
		toCount(
			await db
				.select({ value: count() })
				.from(student)
				.where(eq(student.isScholar, true)),
		),

	countPendingApplications: async () =>
		toCount(
			await db
				.select({ value: count() })
				.from(applications)
				.where(eq(applications.status, 'pending')),
		),

	countApprovedApplications: async () =>
		toCount(
			await db
				.select({ value: count() })
				.from(applications)
				.where(eq(applications.status, 'approved')),
		),

	countRegisteredAllowlist: async () =>
		toCount(
			await db
				.select({ value: count() })
				.from(studentAllowlist)
				.where(eq(studentAllowlist.isRegistered, true)),
		),
});

export type AnalyticsRepo = ReturnType<typeof createAnalyticsRepo>;
