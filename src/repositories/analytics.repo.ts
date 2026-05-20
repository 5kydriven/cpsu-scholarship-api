import type { Db } from '@/db';
import {
	applications,
	courses,
	eligibilitySuggestionRuns,
	programOfferings,
	scholarshipPrograms,
	student,
	studentAllowlist,
} from '@/db/schema';
import type {
	AnalyticsFilters,
	AnalyticsTimeBucket,
} from '@/modules/analytics/analytics.schema';
import type {
	AnalyticsBreakdownRow,
	AnalyticsPredictionRunRow,
	AnalyticsSeriesPoint,
} from '@/types/analytics';
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	lte,
	sql,
	type SQL,
} from 'drizzle-orm';

const toCount = (rows: { value: number | string | bigint }[]) =>
	Number(rows[0]?.value ?? 0);

const whereFrom = (conditions: (SQL | undefined)[]) => {
	const compact = conditions.filter((condition): condition is SQL =>
		Boolean(condition),
	);

	return compact.length > 0 ? and(...compact) : undefined;
};

const createdAtConditions = (
	column: typeof applications.createdAt | typeof student.createdAt,
	filters: AnalyticsFilters,
) => [
	filters.from ? gte(column, filters.from) : undefined,
	filters.to ? lte(column, filters.to) : undefined,
];

const studentConditions = (filters: AnalyticsFilters) =>
	whereFrom([
		filters.courseId ? eq(student.courseId, filters.courseId) : undefined,
		...createdAtConditions(student.createdAt, filters),
	]);

const allowlistConditions = (filters: AnalyticsFilters) =>
	whereFrom([
		filters.from ? gte(studentAllowlist.createdAt, filters.from) : undefined,
		filters.to ? lte(studentAllowlist.createdAt, filters.to) : undefined,
	]);

const applicationConditions = (filters: AnalyticsFilters) =>
	whereFrom([
		filters.status ? eq(applications.status, filters.status) : undefined,
		filters.offeringId
			? eq(applications.offeringId, filters.offeringId)
			: undefined,
		filters.courseId ? eq(applications.courseId, filters.courseId) : undefined,
		filters.schoolYear
			? eq(programOfferings.schoolYear, filters.schoolYear)
			: undefined,
		filters.programId
			? eq(programOfferings.scholarshipProgramId, filters.programId)
			: undefined,
		...createdAtConditions(applications.createdAt, filters),
	]);

const predictionRunConditions = (filters: AnalyticsFilters) =>
	whereFrom([
		filters.offeringId
			? eq(eligibilitySuggestionRuns.offeringId, filters.offeringId)
			: undefined,
		filters.from
			? gte(eligibilitySuggestionRuns.generatedAt, filters.from)
			: undefined,
		filters.to ? lte(eligibilitySuggestionRuns.generatedAt, filters.to) : undefined,
	]);

const bucketExpression = (bucket: AnalyticsTimeBucket) => {
	switch (bucket) {
		case 'day':
			return sql<string>`date_trunc('day', ${applications.createdAt})::date::text`;
		case 'month':
			return sql<string>`date_trunc('month', ${applications.createdAt})::date::text`;
		case 'year':
			return sql<string>`date_trunc('year', ${applications.createdAt})::date::text`;
	}
};

export const createAnalyticsRepo = (db: Db) => ({
	countStudents: async (filters: AnalyticsFilters = {}) =>
		toCount(
			await db
				.select({ value: count() })
				.from(student)
				.where(studentConditions(filters)),
		),

	countApprovedScholars: async (filters: AnalyticsFilters = {}) =>
		toCount(
			await db
				.select({ value: count() })
				.from(student)
				.where(
					whereFrom([
						eq(student.isScholar, true),
						studentConditions(filters),
					]),
				),
		),

	countRegisteredAllowlist: async (filters: AnalyticsFilters = {}) =>
		toCount(
			await db
				.select({ value: count() })
				.from(studentAllowlist)
				.where(
					whereFrom([
						eq(studentAllowlist.isRegistered, true),
						allowlistConditions(filters),
					]),
				),
		),

	countApplications: async (filters: AnalyticsFilters = {}) =>
		toCount(
			await db
				.select({ value: count() })
				.from(applications)
				.leftJoin(
					programOfferings,
					eq(applications.offeringId, programOfferings.id),
				)
				.where(applicationConditions(filters)),
		),

	breakdownApplicationsByStatus: async (
		filters: AnalyticsFilters = {},
	): Promise<AnalyticsBreakdownRow[]> => {
		const rows = await db
			.select({
				key: applications.status,
				label: applications.status,
				value: count(),
			})
			.from(applications)
			.leftJoin(programOfferings, eq(applications.offeringId, programOfferings.id))
			.where(applicationConditions(filters))
			.groupBy(applications.status)
			.orderBy(asc(applications.status));

		return rows.map((row) => ({
			key: row.key,
			label: row.label.replace('_', ' '),
			value: Number(row.value),
		}));
	},

	breakdownApplicationsByCourse: async (
		filters: AnalyticsFilters = {},
	): Promise<AnalyticsBreakdownRow[]> => {
		const rows = await db
			.select({
				key: sql<string>`coalesce(${courses.id}::text, 'unassigned')`,
				label: sql<string>`coalesce(${courses.abbreviation}, 'Unassigned')`,
				value: count(),
			})
			.from(applications)
			.leftJoin(courses, eq(applications.courseId, courses.id))
			.leftJoin(programOfferings, eq(applications.offeringId, programOfferings.id))
			.where(applicationConditions(filters))
			.groupBy(courses.id, courses.abbreviation)
			.orderBy(asc(courses.abbreviation));

		return rows.map((row) => ({ ...row, value: Number(row.value) }));
	},

	breakdownApplicationsByOffering: async (
		filters: AnalyticsFilters = {},
	): Promise<AnalyticsBreakdownRow[]> => {
		const rows = await db
			.select({
				key: programOfferings.id,
				label: sql<string>`coalesce(${scholarshipPrograms.name} || ' ' || ${programOfferings.schoolYear}, ${programOfferings.schoolYear}, ${programOfferings.id}::text)`,
				value: count(),
			})
			.from(applications)
			.leftJoin(programOfferings, eq(applications.offeringId, programOfferings.id))
			.leftJoin(
				scholarshipPrograms,
				eq(programOfferings.scholarshipProgramId, scholarshipPrograms.id),
			)
			.where(applicationConditions(filters))
			.groupBy(
				programOfferings.id,
				programOfferings.schoolYear,
				scholarshipPrograms.name,
			)
			.orderBy(desc(programOfferings.schoolYear));

		return rows.map((row) => ({
			key: row.key ?? 'unknown',
			label: row.label,
			value: Number(row.value),
		}));
	},

	breakdownApplicationsBySchoolYear: async (
		filters: AnalyticsFilters = {},
	): Promise<AnalyticsBreakdownRow[]> => {
		const rows = await db
			.select({
				key: programOfferings.schoolYear,
				label: programOfferings.schoolYear,
				value: count(),
			})
			.from(applications)
			.leftJoin(programOfferings, eq(applications.offeringId, programOfferings.id))
			.where(applicationConditions(filters))
			.groupBy(programOfferings.schoolYear)
			.orderBy(desc(programOfferings.schoolYear));

		return rows.map((row) => ({
			key: row.key ?? 'unknown',
			label: row.label ?? 'Unknown',
			value: Number(row.value),
		}));
	},

	seriesApplicationsOverTime: async (
		filters: AnalyticsFilters = {},
		bucket: AnalyticsTimeBucket = 'month',
	): Promise<AnalyticsSeriesPoint[]> => {
		const bucketStart = bucketExpression(bucket);
		const rows = await db
			.select({
				bucketStart,
				value: count(),
			})
			.from(applications)
			.leftJoin(programOfferings, eq(applications.offeringId, programOfferings.id))
			.where(applicationConditions(filters))
			.groupBy(bucketStart)
			.orderBy(asc(bucketStart));

		return rows.map((row) => ({
			bucketStart: row.bucketStart,
			value: Number(row.value),
		}));
	},

	listPredictionRuns: async (
		filters: AnalyticsFilters = {},
	): Promise<AnalyticsPredictionRunRow[]> =>
		db.query.eligibilitySuggestionRuns.findMany({
			where: predictionRunConditions(filters),
			orderBy: desc(eligibilitySuggestionRuns.generatedAt),
			limit: 25,
		}).then((rows) =>
			rows.map((row) => ({
				runId: row.id,
				offeringId: row.offeringId,
				generatedAt: row.generatedAt,
				suggestedCount: row.suggestedCount,
				criteriaSnapshot: row.criteriaSnapshot,
			})),
		),
});

export type AnalyticsRepo = ReturnType<typeof createAnalyticsRepo>;
