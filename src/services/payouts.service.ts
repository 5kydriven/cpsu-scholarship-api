import { Errors } from '@/lib/errors';
import type { PayoutsRepo } from '@/repositories/payouts.repo';
import type { StaffProfilesRepo } from '@/repositories/staff_profiles.repo';
import type { StudentsRepo } from '@/repositories/students.repo';

export const createPayoutsService = (
	payoutsRepo: PayoutsRepo,
	studentsRepo: StudentsRepo,
	staffProfilesRepo: StaffProfilesRepo,
) => ({
	async getById(id: string) {
		const payout = await payoutsRepo.findById(id);
		if (!payout) throw Errors.notFound('Payout not found');
		return payout;
	},

	async listMine(userId: string) {
		const student = await studentsRepo.findByUserId(userId);
		if (!student) {
			throw Errors.forbidden('student profile');
		}

		const payouts = await payoutsRepo.findManyByStudentId(student.id);
		return { data: payouts };
	},

	async openClaims(ids: string[], userId: string) {
		const staffProfile = await staffProfilesRepo.findByUserId(userId);
		if (!staffProfile) {
			throw Errors.forbidden('staff profile');
		}

		const claimableAt = new Date().toISOString();
		const result = await payoutsRepo.openClaims(ids, staffProfile.id, claimableAt);

		if (result.type === 'missing') {
			throw Errors.notFound(`Payouts not found: ${result.missingIds.join(', ')}`);
		}

		if (result.type === 'application_not_approved') {
			throw Errors.conflict('The application must be approved before release');
		}

		if (result.type === 'not_pending') {
			throw Errors.conflict('Only pending payouts can be opened for claim');
		}

		if (result.type === 'offering_archived') {
			throw Errors.conflict('Archived offerings cannot release payouts');
		}

		if (result.type === 'missing_cutoff') {
			throw Errors.conflict('Approved application is missing max payout school year');
		}

		if (result.type === 'cutoff_exceeded') {
			throw Errors.conflict(
				'This scholar has exceeded their eligible school years and cannot receive further payouts.',
			);
		}

		return { data: result.payouts };
	},

	async submitCheckAndRelease(opts: {
		id: string;
		userId: string;
		checkNo: string;
		checkImageUrl: string;
	}) {
		const student = await studentsRepo.findByUserId(opts.userId);
		if (!student) {
			throw Errors.forbidden('student profile');
		}

		const releasedAt = new Date().toISOString();
		const result = await payoutsRepo.releaseWithStudentCheck({
			id: opts.id,
			studentId: student.id,
			checkNo: opts.checkNo,
			checkImageUrl: opts.checkImageUrl,
			releasedAt,
		});

		if (result.type === 'missing') {
			throw Errors.notFound('Payout not found');
		}

		if (result.type === 'not_owner') {
			throw Errors.forbidden('payout owner');
		}

		if (result.type === 'application_not_approved') {
			throw Errors.conflict('The application must be approved before release');
		}

		if (result.type === 'not_pending') {
			throw Errors.conflict('The payout must be pending before release');
		}

		if (result.type === 'not_claimable') {
			throw Errors.conflict('This payout is not yet open for claiming');
		}

		if (result.type === 'offering_archived') {
			throw Errors.conflict('Archived offerings cannot release payouts');
		}

		if (result.type === 'missing_cutoff') {
			throw Errors.conflict('Approved application is missing max payout school year');
		}

		if (result.type === 'cutoff_exceeded') {
			throw Errors.conflict(
				'This scholar has exceeded their eligible school years and cannot receive further payouts.',
			);
		}

		if (!result.payout) {
			throw Errors.internal('Released payout could not be loaded');
		}

		return result.payout;
	},
});

export type PayoutsService = ReturnType<typeof createPayoutsService>;
