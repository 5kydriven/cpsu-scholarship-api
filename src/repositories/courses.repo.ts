import { eq, ilike, count, asc, desc, and, gt, lt, or } from 'drizzle-orm';
import { courses } from '@/db/schema';
import type { NewCourse } from '@/db/schema';
import type { Db } from '@/db';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import type { SortOrder } from '@/types/common';

export const createCoursesRepo = (db: Db) => ({
	findById: (id: string) =>
		db
			.select()
			.from(courses)
			.where(eq(courses.id, id))
			.limit(1)
			.then((r) => r[0] ?? null),

	create: (data: NewCourse) =>
		db
			.insert(courses)
			.values(data)
			.returning()
			.then((r) => r[0]),

	update: (id: string, data: Partial<NewCourse>) =>
		db
			.update(courses)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(courses.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	delete: (id: string) =>
		db
			.delete(courses)
			.where(eq(courses.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	// Offset pagination with search + sort
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
					ilike(courses.name, `%${search}%`),
					ilike(courses.abbreviation, `%${search}%`),
					ilike(courses.major, `%${search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderBy =
			sortOrder === 'asc' ? asc(courses[sortField]) : desc(courses[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db
				.select()
				.from(courses)
				.where(where)
				.orderBy(orderBy)
				.limit(perPage)
				.offset(offset),
			db.select({ value: count() }).from(courses).where(where),
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
				? gt(courses.id, decodedCursor.id)
				: lt(courses.id, decodedCursor.id)
			: undefined;

		const rows = await db
			.select()
			.from(courses)
			.where(where)
			.orderBy(direction === 'next' ? asc(courses.id) : desc(courses.id))
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

export type CoursesRepo = ReturnType<typeof createCoursesRepo>;
