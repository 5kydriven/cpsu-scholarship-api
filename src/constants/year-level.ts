export const APPLICATION_YEAR_LEVELS = ['1', '2', '3', '4'] as const;

export type ApplicationYearLevel = (typeof APPLICATION_YEAR_LEVELS)[number];

export const isApplicationYearLevel = (
	value: unknown,
): value is ApplicationYearLevel =>
	typeof value === 'string' &&
		APPLICATION_YEAR_LEVELS.includes(value as ApplicationYearLevel);
