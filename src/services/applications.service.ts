import type { NewAddress, NewApplication, NewParent } from '@/db/schema';
import { Errors } from '@/lib/errors';
import type { ApplicationsRepo } from '@/repositories/applications';
import type { ParentsRepo } from '@/repositories/parents.repo';
import type { AddressesRepo } from '@/repositories/addresses.repo';





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

		try {
			const app = await applicationsRepo.create(applicationPayload);
			const parentPayloads = parents.map((p) => ({
				...p,
				applicationId: app.id,
			}));
			const createdParents = await parentsRepo.createMany(parentPayloads);

			return { application: app, parents: createdParents };
		} catch (error) {
			throw error;
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
