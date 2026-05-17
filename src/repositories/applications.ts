import type { Db } from '@/db';
import {
	applications,
	payouts,
	student,
	type NewApplication,
} from '@/db/schema';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import { computeGraduationSchoolYear } from '@/utils/school-year';
import {
	and,
	asc,
	count,
	desc,
	eq,
	gt,
	ilike,
	inArray,
	lt,
	or,
	sql,
} from 'drizzle-orm';

const applicationWithRelations = {
	addresses: true,
	parents: true,
	offering: true,
	student: true,
	course: true,
} as const;

const approvalSemesters = ['1', '2'] as const;

export const createApplicationsRepo = (db: Db) => ({
	findById: (id: string) =>
		db.query.applications
			.findFirst({
				where: eq(applications.id, id),
				with: applicationWithRelations,
			})
			.then((r) => r ?? null),

	findManyByIds: (ids: string[]) =>
		ids.length === 0
			? Promise.resolve([])
			: db.query.applications.findMany({
					where: inArray(applications.id, ids),
					with: applicationWithRelations,
				}),

	findPendingByOfferingId: (offeringId: string) =>
		db.query.applications.findMany({
			where: and(
				eq(applications.offeringId, offeringId),
				eq(applications.status, 'pending'),
			),
			with: applicationWithRelations,
		}),

	create: (data: NewApplication) =>
		db
			.insert(applications)
			.values(data)
			.returning()
			.then((r) => r[0]),

	update: (id: string, data: Partial<NewApplication>) =>
		db
			.update(applications)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(applications.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	approveMany: async (ids: string[], reviewedBy: string, reviewedAt: string) => {
		if (ids.length === 0) {
			return { type: 'approved' as const, applications: [] };
		}

		return db.transaction(async (tx) => {
			const applicationsToApprove = await tx.query.applications.findMany({
				where: inArray(applications.id, ids),
				with: applicationWithRelations,
			});
			const applicationsById = new Map(
				applicationsToApprove.map((application) => [
					application.id,
					application,
				]),
			);
			const missingIds = ids.filter((id) => !applicationsById.has(id));
			if (missingIds.length > 0) {
				return { type: 'missing' as const, missingIds };
			}

			const finalApplications = applicationsToApprove.filter((application) =>
				['approved', 'rejected'].includes(application.status),
			);
			if (finalApplications.length > 0) {
				return { type: 'final' as const, applications: finalApplications };
			}

			for (const application of applicationsToApprove) {
				const offering = application.offering;
				const [{ total }] = await tx
					.select({
						total: sql<string>`coalesce(sum(${payouts.amount}), 0)`,
					})
					.from(payouts)
					.innerJoin(
						applications,
						eq(payouts.applicationId, applications.id),
					)
					.where(
						and(
							eq(applications.offeringId, application.offeringId),
							eq(applications.status, 'approved'),
						),
					);
				const totalReleased = Number(total);
				const amountPerSemester = Number(offering.amountPerSemester);
				const totalBudget = Number(offering.totalBudget);

				if (totalReleased + amountPerSemester * 2 > totalBudget) {
					return { type: 'budget_exceeded' as const };
				}

				const expectedGraduationSy = computeGraduationSchoolYear(
					application.yearLevel,
					offering.schoolYear,
				);
				const payoutAmount =
					amountPerSemester +
					(application.pwdUrl ? Number(offering.pwdAdditional) : 0);

				await tx
					.update(applications)
					.set({
						status: 'approved',
						reviewedBy,
						reviewedAt,
						yearLevelAtApproval: application.yearLevel,
						expectedGraduationSy,
						maxPayoutSy: expectedGraduationSy,
						updatedAt: reviewedAt,
					})
					.where(eq(applications.id, application.id));

				await tx
					.update(student)
					.set({ isScholar: true, updatedAt: reviewedAt })
					.where(eq(student.id, application.studentId));

				await tx.insert(payouts).values(
					approvalSemesters.map((semester) => ({
						applicationId: application.id,
						semester,
						amount: payoutAmount.toFixed(2),
						status: 'pending' as const,
					})),
				);
			}

			const approvedApplications = await tx.query.applications.findMany({
				where: inArray(applications.id, ids),
				with: applicationWithRelations,
			});

			return {
				type: 'approved' as const,
				applications: approvedApplications,
			};
		});
	},

	reject: async (id: string, reviewedBy: string, reviewedAt: string) =>
		db.transaction(async (tx) => {
			const application = await tx.query.applications.findFirst({
				where: eq(applications.id, id),
				with: applicationWithRelations,
			});

			if (!application) return { type: 'missing' as const };

			if (['approved', 'rejected'].includes(application.status)) {
				return { type: 'final' as const, application };
			}

			await tx
				.update(applications)
				.set({
					status: 'rejected',
					reviewedBy,
					reviewedAt,
					updatedAt: reviewedAt,
				})
				.where(eq(applications.id, id));

			const rejectedApplication = await tx.query.applications.findFirst({
				where: eq(applications.id, id),
				with: applicationWithRelations,
			});

			return {
				type: 'rejected' as const,
				application: rejectedApplication ?? null,
			};
		}),

	markManyUnderReview: async (ids: string[], reviewedAt: string) => {
		if (ids.length === 0) return [];

		await db
			.update(applications)
			.set({
				status: 'under_review',
				updatedAt: reviewedAt,
			})
			.where(inArray(applications.id, ids));

		return db.query.applications.findMany({
			where: inArray(applications.id, ids),
			with: applicationWithRelations,
		});
	},

	delete: (id: string) =>
		db
			.delete(applications)
			.where(eq(applications.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	findManyOffset: async (opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'firstName' | 'lastName' | 'middleName' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) => {
		const {
			page,
			perPage,
			search,
			sortField = 'createdAt',
			sortOrder = 'desc',
		} = opts;
		const offset = (page - 1) * perPage;

		const conditions = [];
		if (search) {
			conditions.push(
				or(
					ilike(applications.firstName, `%${search}%`),
					ilike(applications.lastName, `%${search}%`),
					ilike(applications.middleName, `%${search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderBy =
			sortOrder === 'asc'
				? asc(applications[sortField])
				: desc(applications[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db.query.applications.findMany({
				where,
				orderBy,
				limit: perPage,
				offset,
				with: applicationWithRelations,
			}),
			db.select({ value: count() }).from(applications).where(where),
		]);

		return { rows, total: Number(total) };
	},

	findManyCursor: async (opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) => {
		const { cursor, perPage, direction } = opts;
		const decodedCursor = decodeCursor(cursor);

		const where = decodedCursor?.id
			? direction === 'next'
				? gt(applications.id, decodedCursor.id)
				: lt(applications.id, decodedCursor.id)
			: undefined;

		const rows = await db.query.applications.findMany({
			where,
			orderBy:
				direction === 'next' ? asc(applications.id) : desc(applications.id),
			limit: perPage + 1,
			with: applicationWithRelations,
		});
		const hasMore = rows.length > perPage;
		if (hasMore) rows.pop();

		if (direction === 'prev') rows.reverse();

		const nextCursor =
			rows.length > 0 && (direction === 'next' ? hasMore : cursor)
				? encodeCursor(rows.at(-1)!.id)
				: null;
		const prevCursor =
			rows.length > 0 && (direction === 'next' ? cursor : hasMore)
				? encodeCursor(rows[0].id)
				: null;

		return {
			rows,
			nextCursor,
			prevCursor,
			hasNext: nextCursor !== null,
			hasPrev: prevCursor !== null,
		};
	},
});

export type ApplicationsRepo = ReturnType<typeof createApplicationsRepo>;
