export const parseCorsOrigins = (value: string) =>
	value
		.split(',')
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);

export const getCorsOrigin = (value: string, requestOrigin?: string) => {
	const allowedOrigins = parseCorsOrigins(value);
	const fallbackOrigin = allowedOrigins[0] ?? '';

	if (!requestOrigin) return fallbackOrigin;
	if (allowedOrigins.includes(requestOrigin)) return requestOrigin;

	return fallbackOrigin;
};
