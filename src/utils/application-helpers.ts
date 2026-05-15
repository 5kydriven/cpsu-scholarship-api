import { Errors } from '@/lib/errors';
import type { ApplicationsRepo } from '@/repositories/applications';

export const finalApplicationStatuses = new Set(['approved', 'rejected']);

export type ApplicationRecord = NonNullable<
	Awaited<ReturnType<ApplicationsRepo['findById']>>
>;

export const toApplicationResponse = (application: ApplicationRecord) => {
	const { offeringId, courseId, student, ...response } = application;
	return response;
};

export const orderApplicationsByIds = (
	applications: ApplicationRecord[],
	ids: string[],
) => {
	const applicationsById = new Map(
		applications.map((application) => [application.id, application]),
	);

	return ids
		.map((id) => applicationsById.get(id))
		.filter((application): application is ApplicationRecord => !!application);
};

const isUniqueConstraintError = (error: unknown) =>
	typeof error === 'object' &&
	error !== null &&
	'code' in error &&
	error.code === '23505';

export const toCreateApplicationError = (error: unknown) => {
	if (isUniqueConstraintError(error)) {
		return Errors.conflict('Application already exists for this offering');
	}

	return error;
};
