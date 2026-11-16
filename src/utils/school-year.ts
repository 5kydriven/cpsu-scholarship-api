import {
	isApplicationYearLevel,
	type ApplicationYearLevel,
} from '@/constants/year-level';
import { Errors } from '@/lib/errors';

const graduationOffsets: Record<ApplicationYearLevel, number> = {
	'1': 3,
	'2': 2,
	'3': 1,
	'4': 0,
};

export const computeGraduationSchoolYear = (
	yearLevel: string,
	schoolYear: string,
) => {
	if (!isApplicationYearLevel(yearLevel)) {
		throw Errors.validation([
			{
				field: 'yearLevel',
				message: 'Year level must be a string containing 1, 2, 3, or 4',
			},
		]);
	}

	const offset = graduationOffsets[yearLevel];

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
