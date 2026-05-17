import { Errors } from '@/lib/errors';

const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedFileTypes = new Set([
	'application/pdf',
	'image/jpeg',
	'image/png',
]);
const allowedImageTypes = new Set(['image/jpeg', 'image/png']);

const isUploadedFile = (value: unknown): value is File =>
	typeof value === 'object' &&
	value !== null &&
	'name' in value &&
	'size' in value &&
	'type' in value &&
	'arrayBuffer' in value &&
	typeof (value as { arrayBuffer: unknown }).arrayBuffer === 'function';

export const fileValidator = (value: unknown) => {
	if (!isUploadedFile(value)) {
		throw Errors.validation([
			{ field: 'file', message: 'A PDF, JPEG, or PNG file is required' },
		]);
	}

	if (value.size === 0) {
		throw Errors.validation([{ field: 'file', message: 'File is required' }]);
	}

	if (value.size > maxFileSizeBytes) {
		throw Errors.validation([
			{ field: 'file', message: 'File must be 5 MB or smaller' },
		]);
	}

	if (!allowedFileTypes.has(value.type)) {
		throw Errors.validation([
			{ field: 'file', message: 'Only PDF, JPEG, and PNG files are allowed' },
		]);
	}

	return value;
};

export const imageValidator = (value: unknown) => {
	const file = fileValidator(value);

	if (!allowedImageTypes.has(file.type)) {
		throw Errors.validation([
			{ field: 'file', message: 'Only JPEG and PNG images are allowed' },
		]);
	}

	return file;
};
