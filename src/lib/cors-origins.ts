export const parseCorsOrigins = (value: string) =>
	value
		.split(',')
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);

export const getCorsOrigin = (value: string, requestOrigin?: string) => {
	const allowedOrigins = parseCorsOrigins(value);

	if (!requestOrigin) return '';

	return allowedOrigins.includes(requestOrigin) ? requestOrigin : '';
};
