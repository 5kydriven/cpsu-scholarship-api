import { NewProgramOffering } from '@/db/schema';
import { Errors } from '@/lib/errors';
import { ProgramOfferingsRepo } from '@/repositories/program_offerings.repo';

export const createProgramOfferingsService = (
	programOfferingsRepo: ProgramOfferingsRepo,
) => ({
	async getById(id: string) {
		const programOffering = await programOfferingsRepo.findById(id);
		if (!programOffering) throw Errors.notFound('Program Offering not found');
		return programOffering;
	},

	async softDelete(id: string) {
		const existing = await programOfferingsRepo.findById(id);
		if (!existing) throw Errors.notFound('Program Offering not found');
		if (existing.isActive) {
			throw Errors.conflict('Active offerings cannot be archived');
		}

		const programOffering = await programOfferingsRepo.softDelete(id);
		if (!programOffering) throw Errors.notFound('Program Offering not found');
		return programOffering;
	},

	async create(programOffering: NewProgramOffering) {
		return programOfferingsRepo.create({
			...programOffering,
			isActive: true,
			isArchived: false,
		});
	},

	async update(id: string, programOffering: Partial<NewProgramOffering>) {
		const programOfferingToUpdate = await programOfferingsRepo.findById(id);
		if (!programOfferingToUpdate)
			throw Errors.notFound('Program Offering not found');

		if (programOfferingToUpdate.isArchived) {
			throw Errors.conflict('Archived offerings are read-only');
		}

		const nextIsActive = programOffering.isActive ?? programOfferingToUpdate.isActive;
		const nextIsArchived =
			programOffering.isArchived ?? programOfferingToUpdate.isArchived;

		if (!programOfferingToUpdate.isActive && programOffering.isActive === true) {
			throw Errors.conflict('Closed offerings cannot be reopened');
		}

		if (nextIsActive && nextIsArchived) {
			throw Errors.conflict(
				'An offering cannot be both active and archived at the same time',
			);
		}

		if (programOffering.isArchived === true && programOfferingToUpdate.isActive) {
			throw Errors.conflict('Only closed offerings can be archived');
		}

		return programOfferingsRepo.update(id, programOffering);
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'schoolYear' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return programOfferingsRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return programOfferingsRepo.findManyCursor(opts);
	},
});

export type ProgramOfferingsService = ReturnType<
	typeof createProgramOfferingsService
>;
