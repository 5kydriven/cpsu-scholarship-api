import type { Db } from '@/db';
import { applications, payouts } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

const payoutWithApplication = {
	application: {
		with: {
			offering: true,
		},
	},
} as const;

export const createPayoutsRepo = (db: Db) => ({
	findById: (id: string) =>
		db.query.payouts
			.findFirst({
				where: eq(payouts.id, id),
			})
			.then((r) => r ?? null),

	findManyByStudentId: (studentId: string) =>
		db
			.select({
				id: payouts.id,
				applicationId: payouts.applicationId,
				semester: payouts.semester,
				amount: payouts.amount,
				status: payouts.status,
				isClaimable: payouts.isClaimable,
				claimableBy: payouts.claimableBy,
				claimableAt: payouts.claimableAt,
				checkNo: payouts.checkNo,
				checkImageUrl: payouts.checkImageUrl,
				releasedBy: payouts.releasedBy,
				releasedAt: payouts.releasedAt,
				createdAt: payouts.createdAt,
				updatedAt: payouts.updatedAt,
			})
			.from(payouts)
			.innerJoin(applications, eq(payouts.applicationId, applications.id))
			.where(eq(applications.studentId, studentId)),

	openClaims: (ids: string[], claimableBy: string, claimableAt: string) =>
		db.transaction(async (tx) => {
			if (ids.length === 0) {
				return { type: 'opened' as const, payouts: [] };
			}

			const payoutsToOpen = await tx.query.payouts.findMany({
				where: inArray(payouts.id, ids),
				with: payoutWithApplication,
			});
			const payoutsById = new Map(
				payoutsToOpen.map((payout) => [payout.id, payout]),
			);
			const missingIds = ids.filter((id) => !payoutsById.has(id));
			if (missingIds.length > 0) {
				return { type: 'missing' as const, missingIds };
			}

			for (const payout of payoutsToOpen) {
				if (payout.application.status !== 'approved') {
					return { type: 'application_not_approved' as const };
				}

				if (payout.status !== 'pending') {
					return { type: 'not_pending' as const };
				}

				if (payout.application.offering.isArchived) {
					return { type: 'offering_archived' as const };
				}

				if (!payout.application.maxPayoutSy) {
					return { type: 'missing_cutoff' as const };
				}

				if (payout.application.offering.schoolYear > payout.application.maxPayoutSy) {
					return { type: 'cutoff_exceeded' as const };
				}
			}

			await tx
				.update(payouts)
				.set({
					isClaimable: true,
					claimableBy,
					claimableAt,
					updatedAt: claimableAt,
				})
				.where(inArray(payouts.id, ids));

			const openedPayouts = await tx.query.payouts.findMany({
				where: inArray(payouts.id, ids),
			});

			return {
				type: 'opened' as const,
				payouts: openedPayouts,
			};
		}),

	releaseWithStudentCheck: (opts: {
		id: string;
		studentId: string;
		checkNo: string;
		checkImageUrl: string;
		releasedAt: string;
	}) =>
		db.transaction(async (tx) => {
			const payout = await tx.query.payouts.findFirst({
				where: eq(payouts.id, opts.id),
				with: payoutWithApplication,
			});

			if (!payout) return { type: 'missing' as const };

			if (payout.application.studentId !== opts.studentId) {
				return { type: 'not_owner' as const };
			}

			if (payout.application.status !== 'approved') {
				return { type: 'application_not_approved' as const };
			}

			if (payout.status !== 'pending') {
				return { type: 'not_pending' as const };
			}

			if (!payout.isClaimable) {
				return { type: 'not_claimable' as const };
			}

			if (payout.application.offering.isArchived) {
				return { type: 'offering_archived' as const };
			}

			if (!payout.application.maxPayoutSy) {
				return { type: 'missing_cutoff' as const };
			}

			if (payout.application.offering.schoolYear > payout.application.maxPayoutSy) {
				return { type: 'cutoff_exceeded' as const };
			}

			await tx
				.update(payouts)
				.set({
					status: 'released',
					isClaimable: false,
					checkNo: opts.checkNo,
					checkImageUrl: opts.checkImageUrl,
					releasedAt: opts.releasedAt,
					updatedAt: opts.releasedAt,
				})
				.where(eq(payouts.id, opts.id));

			const releasedPayout = await tx.query.payouts.findFirst({
				where: eq(payouts.id, opts.id),
			});

			return {
				type: 'released' as const,
				payout: releasedPayout ?? null,
			};
		}),
});

export type PayoutsRepo = ReturnType<typeof createPayoutsRepo>;
