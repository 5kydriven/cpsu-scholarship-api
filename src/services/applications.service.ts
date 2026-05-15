import type { NewAddress, NewApplication, NewParent } from '@/db/schema';
import { Errors } from '@/lib/errors';
import type { ApplicationsRepo } from '@/repositories/applications';
import type { ParentsRepo } from '@/repositories/parents.repo';
import type { AddressesRepo } from '@/repositories/addresses.repo';

const isUniqueConstraintError = (error: unknown) =>
	typeof error === 'object' &&
	error !== null &&
	'code' in error &&
	error.code === '23505';

const toCreateApplicationError = (error: unknown) => {
	if (isUniqueConstraintError(error)) {
		return Errors.conflict('Application already exists for this offering');
	}

	return error;
};

export const createApplicationsService = (
	applicationsRepo: ApplicationsRepo,
	parentsRepo: ParentsRepo,
	addressesRepo: AddressesRepo,
) => ({
	async getById(id: string) {
		const application = await applicationsRepo.findById(id);
		if (!application) throw Errors.notFound('Application not found');
		return application;
	},

	async delete(id: string) {
		const application = await applicationsRepo.delete(id);
		if (!application) throw Errors.notFound('Application not found');
	},

	async create(
		application: NewApplication,
		parents: Omit<NewParent, 'applicationId'>[],
		addresses: Omit<NewAddress, 'applicationId'>[],
	) {
		const applicationPayload = { ...application };
		const app = await applicationsRepo.create(applicationPayload).catch((error) => {
			throw toCreateApplicationError(error);
		});

		try {
			const parentPayloads = parents.map((p) => ({
				...p,
				applicationId: app.id,
			}));
			const addressPayloads = addresses.map((address) => ({
				...address,
				applicationId: app.id,
			}));

			await parentsRepo.createMany(parentPayloads);
			await addressesRepo.createMany(addressPayloads);

			const createdApplication = await applicationsRepo.findById(app.id);
			if (!createdApplication) {
				throw Errors.internal('Created application could not be loaded');
			}

			const { offeringId, courseId, student, ...response } = createdApplication;
			return response;
		} catch (error) {
			await applicationsRepo.delete(app.id);
			throw toCreateApplicationError(error);
		}
	},

	async update(id: string, application: Partial<NewApplication>) {
		const applicationToUpdate = await applicationsRepo.findById(id);
		if (!applicationToUpdate) throw Errors.notFound('Application not found');
		return applicationsRepo.update(id, application);
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'firstName' | 'lastName' | 'middleName' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return applicationsRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return applicationsRepo.findManyCursor(opts);
	},
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
