import { Errors } from '@/lib/errors';

const graduationOffsets: Record<string, number> = {
	'1st Year': 3,
	'2nd Year': 2,
	'3rd Year': 1,
	'4th Year': 0,
};

export const computeGraduationSchoolYear = (
	yearLevel: string,
	schoolYear: string,
) => {
	const offset = graduationOffsets[yearLevel];
	if (offset === undefined) {
		throw Errors.validation([
			{
				field: 'yearLevel',
				message: 'Year level must be one of 1st Year, 2nd Year, 3rd Year, or 4th Year',
			},
		]);
	}

	const match = schoolYear.match(/^(\d{4})\s*-\s*(\d{4})$/);
	if (!match) {
		throw Errors.validation([
			{
				field: 'schoolYear',
				message: 'School year must use YYYY-YYYY format',
			},
		]);
	}

	const startYear = Number(match[1]) + offset;
	return `${startYear}-${startYear + 1}`;
};
