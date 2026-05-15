import type { Db } from '@/db';
import { applications, type NewApplication } from '@/db/schema';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import { and, asc, count, desc, eq, gt, ilike, inArray, lt, or } from 'drizzle-orm';

const applicationWithRelations = {
	addresses: true,
	parents: true,
	offering: true,
	student: true,
	course: true,
} as const;

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

	acceptMany: async (ids: string[], reviewedBy: string, reviewedAt: string) => {
		if (ids.length === 0) return [];

		await db
			.update(applications)
			.set({
				status: 'approved',
				reviewedBy,
				reviewedAt,
				updatedAt: reviewedAt,
			})
			.where(inArray(applications.id, ids));

		return db.query.applications.findMany({
			where: inArray(applications.id, ids),
			with: applicationWithRelations,
		});
	},

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
