import type {
	EligibilityCriteriaSnapshot,
	NewEligibilitySuggestion,
} from '@/db/schema';
import { Errors } from '@/lib/errors';
import type { ApplicationsRepo } from '@/repositories/applications';
import type {
	EligibilitySuggestionRunDetail,
	EligibilitySuggestionsRepo,
} from '@/repositories/eligibility_suggestions.repo';
import type { ProgramOfferingsRepo } from '@/repositories/program_offerings.repo';
import {
	orderApplicationsByIds,
	toApplicationResponse,
	type ApplicationRecord,
} from '@/utils/application-helpers';

const maxGwa = 2.5;
const maxAnnualFamilyIncomeExclusive = 100000;
const criteriaSnapshot: EligibilityCriteriaSnapshot = {
	maxGwa,
	maxAnnualFamilyIncomeExclusive,
	priorityProofs: ['fourPsUrl', 'ipUrl', 'pwdUrl'],
	rankingOrder: [
		'priorityProofs desc',
		'annualFamilyIncome asc',
		'gwa asc',
		'createdAt asc',
	],
};

type EligibleApplication = {
	application: ApplicationRecord;
	gwa: number;
	annualFamilyIncome: number;
	priorityProofs: string[];
};

type GeneratedByUser = {
	id: string;
	name: string;
	email: string;
	role: string;
};

export const createEligibilitySuggestionsService = (
	programOfferingsRepo: ProgramOfferingsRepo,
	applicationsRepo: ApplicationsRepo,
	eligibilitySuggestionsRepo: EligibilitySuggestionsRepo,
) => ({
	async generate(offeringId: string, generatedByUser: GeneratedByUser) {
		const offering = await programOfferingsRepo.findById(offeringId);
		if (!offering) throw Errors.notFound('Program Offering not found');

		if (offering.isActive) {
			throw Errors.conflict(
				'Eligibility suggestions can only be generated for inactive offerings',
			);
		}

		const existingRun =
			await eligibilitySuggestionsRepo.findRunByOfferingId(offeringId);
		if (existingRun) {
			throw Errors.conflict(
				'Eligibility suggestions already generated for this offering',
			);
		}

		const pendingApplications =
			await applicationsRepo.findPendingByOfferingId(offeringId);
		const rankedApplications = pendingApplications
			.map(toEligibleApplication)
			.filter((application): application is EligibleApplication => {
				if (!application) return false;
				return (
					application.gwa <= maxGwa &&
					application.annualFamilyIncome < maxAnnualFamilyIncomeExclusive
				);
			})
			.sort(compareEligibleApplications);

		const generatedAt = new Date().toISOString();
		const run = await eligibilitySuggestionsRepo
			.createRun({
				offeringId,
				generatedBy: generatedByUser.id,
				generatedAt,
				criteriaSnapshot,
				suggestedCount: rankedApplications.length,
			})
			.catch((error) => {
				throw toCreateRunError(error);
			});

		const suggestionPayloads = rankedApplications.map(
			(application, index): NewEligibilitySuggestion => ({
				runId: run.id,
				applicationId: application.application.id,
				rank: index + 1,
				gwa: application.gwa.toFixed(2),
				annualFamilyIncome: application.annualFamilyIncome.toFixed(2),
				priorityProofs: application.priorityProofs,
			}),
		);

		await eligibilitySuggestionsRepo.createSuggestions(suggestionPayloads);
		const updatedApplications = await applicationsRepo.markManyUnderReview(
			rankedApplications.map(({ application }) => application.id),
			generatedAt,
		);
		const orderedApplications = orderApplicationsByIds(
			updatedApplications,
			rankedApplications.map(({ application }) => application.id),
		);

		return {
			run: toRunResponse(run),
			generatedByUser,
			suggestions: rankedApplications.map((application, index) => ({
				rank: index + 1,
				application: toApplicationResponse(
					orderedApplications[index] ?? application.application,
				),
				gwa: application.gwa,
				annualFamilyIncome: application.annualFamilyIncome,
				priorityProofs: application.priorityProofs,
			})),
		};
	},

	async listRuns(offeringId: string) {
		const offering = await programOfferingsRepo.findById(offeringId);
		if (!offering) throw Errors.notFound('Program Offering not found');

		const runs = await eligibilitySuggestionsRepo.findRunsByOfferingId(
			offeringId,
		);

		return {
			data: runs.map((run) => ({
				run: toRunResponse(run),
				generatedByUser: toGeneratedByUserResponse(run.generatedByUser),
			})),
		};
	},

	async getRun(offeringId: string, runId: string) {
		const offering = await programOfferingsRepo.findById(offeringId);
		if (!offering) throw Errors.notFound('Program Offering not found');

		const run = await eligibilitySuggestionsRepo.findRunDetail(
			offeringId,
			runId,
		);
		if (!run) throw Errors.notFound('Eligibility suggestion run not found');

		return toRunDetailResponse(run);
	},
});

const toEligibleApplication = (
	application: ApplicationRecord,
): EligibleApplication | null => {
	const gwa = parseDecimal(application.gwa);
	const annualFamilyIncome = application.parents.reduce((total, parent) => {
		const monthlyIncome = parseDecimal(parent.monthlyIncome);
		if (monthlyIncome === null) return Number.NaN;
		return total + monthlyIncome * 12;
	}, 0);

	if (gwa === null || Number.isNaN(annualFamilyIncome)) return null;

	return {
		application,
		gwa,
		annualFamilyIncome,
		priorityProofs: getPriorityProofs(application),
	};
};

const compareEligibleApplications = (
	left: EligibleApplication,
	right: EligibleApplication,
) => {
	const leftHasPriority = left.priorityProofs.length > 0 ? 0 : 1;
	const rightHasPriority = right.priorityProofs.length > 0 ? 0 : 1;

	return (
		leftHasPriority - rightHasPriority ||
		left.annualFamilyIncome - right.annualFamilyIncome ||
		left.gwa - right.gwa ||
		left.application.createdAt.localeCompare(right.application.createdAt)
	);
};

const getPriorityProofs = (
	application: Pick<ApplicationRecord, 'fourPsUrl' | 'ipUrl' | 'pwdUrl'>,
) =>
	[
		application.fourPsUrl ? 'fourPsUrl' : null,
		application.ipUrl ? 'ipUrl' : null,
		application.pwdUrl ? 'pwdUrl' : null,
	].filter((proof): proof is string => proof !== null);

const parseDecimal = (value: string | null | undefined) => {
	if (!value) return null;

	const parsed = Number(value.replace(/,/g, '').trim());
	return Number.isFinite(parsed) ? parsed : null;
};

const isUniqueConstraintError = (error: unknown) =>
	typeof error === 'object' &&
	error !== null &&
	'code' in error &&
	error.code === '23505';

const toCreateRunError = (error: unknown) => {
	if (isUniqueConstraintError(error)) {
		return Errors.conflict(
			'Eligibility suggestions already generated for this offering',
		);
	}

	return error;
};

const toRunResponse = (
	run: Pick<
		EligibilitySuggestionRunDetail,
		| 'id'
		| 'offeringId'
		| 'generatedBy'
		| 'generatedAt'
		| 'criteriaSnapshot'
		| 'suggestedCount'
	>,
) => ({
	id: run.id,
	offeringId: run.offeringId,
	generatedBy: run.generatedBy,
	generatedAt: run.generatedAt,
	criteriaSnapshot: run.criteriaSnapshot,
	suggestedCount: run.suggestedCount,
});

const toGeneratedByUserResponse = (
	user: EligibilitySuggestionRunDetail['generatedByUser'] | null,
) =>
	user
		? {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			}
		: null;

const toRunDetailResponse = (run: EligibilitySuggestionRunDetail) => ({
	run: toRunResponse(run),
	generatedByUser: toGeneratedByUserResponse(run.generatedByUser),
	suggestions: run.suggestions.map((suggestion) => ({
		rank: suggestion.rank,
		application: toApplicationResponse(suggestion.application),
		gwa: Number(suggestion.gwa),
		annualFamilyIncome: Number(suggestion.annualFamilyIncome),
		priorityProofs: suggestion.priorityProofs,
	})),
});

export type EligibilitySuggestionsService = ReturnType<
	typeof createEligibilitySuggestionsService
>;
