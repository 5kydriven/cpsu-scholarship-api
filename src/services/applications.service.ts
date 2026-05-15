import type { NewAddress, NewApplication, NewParent } from '@/db/schema';
import { Errors } from '@/lib/errors';
import type { ApplicationsRepo } from '@/repositories/applications';
import type { ParentsRepo } from '@/repositories/parents.repo';
import type { AddressesRepo } from '@/repositories/addresses.repo';
import type { StudentsRepo } from '@/repositories/students.repo';
import {
	finalApplicationStatuses,
	orderApplicationsByIds,
	toApplicationResponse,
	toCreateApplicationError,
} from '@/utils/application-helpers';

export const createApplicationsService = (
	applicationsRepo: ApplicationsRepo,
	parentsRepo: ParentsRepo,
	addressesRepo: AddressesRepo,
	studentsRepo: StudentsRepo,
) => ({
	async getById(id: string) {
		const application = await applicationsRepo.findById(id);
		if (!application) throw Errors.notFound('Application not found');
		return toApplicationResponse(application);
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
			const updatedStudent = await studentsRepo.updateSubmittedProfile(
				app.studentId,
				{
					name: buildFullName(application),
					firstName: application.firstName,
					lastName: application.lastName,
					middleName: application.middleName ?? null,
					extName: application.extName ?? null,
					courseId: application.courseId ?? null,
				},
			);

			if (!updatedStudent) {
				throw Errors.notFound('Student not found');
			}

			const createdApplication = await applicationsRepo.findById(app.id);
			if (!createdApplication) {
				throw Errors.internal('Created application could not be loaded');
			}

			return toApplicationResponse(createdApplication);
		} catch (error) {
			await applicationsRepo.delete(app.id);
			throw toCreateApplicationError(error);
		}
	},

	async accept(id: string, reviewedBy: string) {
		const application = await applicationsRepo.findById(id);
		if (!application) throw Errors.notFound('Application not found');

		if (finalApplicationStatuses.has(application.status)) {
			throw Errors.conflict(`Application is already ${application.status}`);
		}

		const reviewedAt = new Date().toISOString();
		const [acceptedApplication] = await applicationsRepo.acceptMany(
			[id],
			reviewedBy,
			reviewedAt,
		);

		if (!acceptedApplication) {
			throw Errors.internal('Accepted application could not be loaded');
		}

		return toApplicationResponse(acceptedApplication);
	},

	async acceptMany(ids: string[], reviewedBy: string) {
		const uniqueIds = [...new Set(ids)];
		const applications = await applicationsRepo.findManyByIds(uniqueIds);
		const applicationsById = new Map(
			applications.map((application) => [application.id, application]),
		);
		const missingIds = uniqueIds.filter((id) => !applicationsById.has(id));

		if (missingIds.length > 0) {
			throw Errors.notFound(`Applications not found: ${missingIds.join(', ')}`);
		}

		const finalApplications = orderApplicationsByIds(
			applications,
			uniqueIds,
		).filter((application) =>
			finalApplicationStatuses.has(application.status),
		);

		if (finalApplications.length > 0) {
			throw Errors.conflict(
				`Applications already finalized: ${finalApplications
					.map((application) => application.id)
					.join(', ')}`,
			);
		}

		const reviewedAt = new Date().toISOString();
		const acceptedApplications = await applicationsRepo.acceptMany(
			uniqueIds,
			reviewedBy,
			reviewedAt,
		);
		const orderedApplications = orderApplicationsByIds(
			acceptedApplications,
			uniqueIds,
		);

		if (orderedApplications.length !== uniqueIds.length) {
			throw Errors.internal('Accepted applications could not be loaded');
		}

		return { data: orderedApplications.map(toApplicationResponse) };
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
		const { rows, total } = await applicationsRepo.findManyOffset(opts);
		return { rows: rows.map(toApplicationResponse), total };
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		const { rows, ...meta } = await applicationsRepo.findManyCursor(opts);
		return { rows: rows.map(toApplicationResponse), ...meta };
	},
});

const buildFullName = (
	application: Pick<
		NewApplication,
		'firstName' | 'lastName' | 'middleName' | 'extName'
	>,
) =>
	[
		application.firstName,
		application.middleName,
		application.lastName,
		application.extName,
	]
		.map((part) => part?.trim())
		.filter((part): part is string => !!part)
		.join(' ');

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
