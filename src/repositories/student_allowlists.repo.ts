import { Db } from '@/db';
import {
	studentAllowlist,
	type NewStudentAllowlist,
} from '@/db/schema/student_allowlist';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import { SortOrder } from '@/types/common';
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
} from 'drizzle-orm';

export const createStudentAllowlistsRepo = (db: Db) => ({
	findById: (id: string) =>
		db
			.select()
			.from(studentAllowlist)
			.where(eq(studentAllowlist.id, id))
			.limit(1)
			.then((r) => r[0] ?? null),

	findByStudentNumber: (studentNumber: string) =>
		db
			.select()
			.from(studentAllowlist)
			.where(eq(studentAllowlist.studentNumber, studentNumber))
			.limit(1)
			.then((r) => r[0] ?? null),

	markRegistered: (studentNumber: string, registeredUserId: string) => {
		const now = new Date().toISOString();

		return db
			.update(studentAllowlist)
			.set({
				isRegistered: true,
				registeredUserId,
				registeredAt: now,
				updatedAt: now,
			})
			.where(eq(studentAllowlist.studentNumber, studentNumber))
			.returning()
			.then((r) => r[0] ?? null);
	},

	findExistingStudentNumbers: async (studentNumbers: string[]) => {
		if (studentNumbers.length === 0) return new Set<string>();

		const rows = await db
			.select({ studentNumber: studentAllowlist.studentNumber })
			.from(studentAllowlist)
			.where(inArray(studentAllowlist.studentNumber, studentNumbers));

		return new Set(rows.map((row) => row.studentNumber));
	},

	createMany: async (rows: NewStudentAllowlist[]) => {
		if (rows.length === 0) return [];

		return db
			.insert(studentAllowlist)
			.values(rows)
			.onConflictDoNothing({ target: studentAllowlist.studentNumber })
			.returning();
	},

	delete: (id: string) =>
		db
			.delete(studentAllowlist)
			.where(eq(studentAllowlist.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	findManyOffset: async (opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'name' | 'createdAt';
		sortOrder?: SortOrder;
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
					ilike(studentAllowlist.studentNumber, `%${search}%`),
					ilike(studentAllowlist.name, `%${search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderBy =
			sortOrder === 'asc'
				? asc(studentAllowlist[sortField])
				: desc(studentAllowlist[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db
				.select()
				.from(studentAllowlist)
				.where(where)
				.orderBy(orderBy)
				.limit(perPage)
				.offset(offset),
			db.select({ value: count() }).from(studentAllowlist).where(where),
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
				? gt(studentAllowlist.id, decodedCursor.id)
				: lt(studentAllowlist.id, decodedCursor.id)
			: undefined;

		const rows = await db
			.select()
			.from(studentAllowlist)
			.where(where)
			.orderBy(
				direction === 'next'
					? asc(studentAllowlist.id)
					: desc(studentAllowlist.id),
			)
			.limit(perPage + 1);
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

export type StudentAllowlistsRepo = ReturnType<
	typeof createStudentAllowlistsRepo
>;
