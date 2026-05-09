import type { RouteHandler } from '@hono/zod-openapi';
import { createStudentAllowlistsRepo } from '@/repositories/student_allowlists.repo';
import { createStudentAllowlistService } from '@/services/student_allowlist.service';
import type { AppEnv } from '@/types/app';
import type { Context } from 'hono';
import { createCursorMeta, createOffsetMeta } from '@/lib/pagination';
import { Errors } from '@/lib/errors';
import { normalizeStudentNumber } from '@/lib/student-number';
import * as XLSX from 'xlsx';
import type {
	importStudentAllowlistsRoute,
	listStudentAllowlistsCursorRoute,
	listStudentAllowlistsRoute,
} from './student_allowlists.route';

const getStudentAllowlistsService = (c: Context<AppEnv>) =>
	createStudentAllowlistService(createStudentAllowlistsRepo(c.get('db')));

const allowedFileExtensions = new Set(['.csv', '.xls', '.xlsx']);
const studentNumberHeaders = new Set([
	'studentidno',
	'studentidnumber',
	'studentnumber',
	'studentid',
]);
const nameHeaders = new Set(['name', 'studentname']);

type ParsedImportRow = {
	row: number;
	studentNumber: string;
	name: string;
};

type InvalidImportRow = {
	row: number;
	message: string;
};

const normalizeHeader = (value: unknown) =>
	String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');

const normalizeCell = (value: unknown) => String(value ?? '').trim();

const normalizeImportedName = (name: string) => {
	const commaIndex = name.indexOf(',');
	if (commaIndex === -1) return name;

	const lastName = name.slice(0, commaIndex).trim();
	const firstName = name.slice(commaIndex + 1).trim();

	return [firstName, lastName].filter(Boolean).join(' ');
};

const getFileExtension = (fileName: string) => {
	const extensionStart = fileName.lastIndexOf('.');
	return extensionStart === -1
		? ''
		: fileName.slice(extensionStart).toLowerCase();
};

const isUploadedFile = (value: unknown): value is File =>
	typeof value === 'object' &&
	value !== null &&
	'name' in value &&
	'arrayBuffer' in value &&
	typeof (value as { arrayBuffer: unknown }).arrayBuffer === 'function';

const readWorkbookRows = async (file: File, extension: string) => {
	const workbook =
		extension === '.csv'
			? XLSX.read(await file.text(), { type: 'string' })
			: XLSX.read(await file.arrayBuffer(), { type: 'array' });
	const firstSheetName = workbook.SheetNames[0];

	if (!firstSheetName) {
		throw Errors.validation([
			{ field: 'file', message: 'The uploaded file has no worksheets' },
		]);
	}

	return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
		header: 1,
		defval: '',
		blankrows: false,
		raw: false,
	});
};

const parseAllowlistRows = (rows: unknown[][]) => {
	const [headers, ...dataRows] = rows;

	if (!headers) {
		throw Errors.validation([{ field: 'file', message: 'The file is empty' }]);
	}

	const normalizedHeaders = headers.map(normalizeHeader);
	const studentNumberIndex = normalizedHeaders.findIndex((header) =>
		studentNumberHeaders.has(header),
	);
	const nameIndex = normalizedHeaders.findIndex((header) =>
		nameHeaders.has(header),
	);

	if (studentNumberIndex === -1 || nameIndex === -1) {
		throw Errors.validation([
			{
				field: 'file',
				message:
					'The file must include Student ID No. and Name columns in the header row',
			},
		]);
	}

	const validRows: ParsedImportRow[] = [];
	const errors: InvalidImportRow[] = [];
	let totalRows = 0;

	dataRows.forEach((row, index) => {
		const rowNumber = index + 2;
		const studentNumber = normalizeStudentNumber(
			normalizeCell(row[studentNumberIndex]),
		);
		const name = normalizeImportedName(normalizeCell(row[nameIndex]));
		const hasAnyValue = row.some((cell) => normalizeCell(cell) !== '');

		if (!hasAnyValue) return;

		totalRows += 1;

		if (!studentNumber || !name) {
			errors.push({
				row: rowNumber,
				message: !studentNumber ? 'Missing Student ID No.' : 'Missing Name',
			});
			return;
		}

		validRows.push({ row: rowNumber, studentNumber, name });
	});

	return { validRows, errors, totalRows };
};

export const importStudentAllowlists: RouteHandler<
	typeof importStudentAllowlistsRoute,
	AppEnv
> = async (c) => {
	const body = await c.req.parseBody();
	const file = body.file;

	if (!isUploadedFile(file)) {
		throw Errors.validation([
			{ field: 'file', message: 'A CSV, XLS, or XLSX file is required' },
		]);
	}

	const extension = getFileExtension(file.name);
	if (!allowedFileExtensions.has(extension)) {
		throw Errors.validation([
			{ field: 'file', message: 'Only CSV, XLS, and XLSX files are allowed' },
		]);
	}

	const rows = await readWorkbookRows(file, extension);
	const { validRows, errors, totalRows } = parseAllowlistRows(rows);

	if (validRows.length === 0) {
		throw Errors.validation([
			{ field: 'file', message: 'The file has no valid allowlist rows' },
		]);
	}

	const user = c.get('user');
	if (!user) throw Errors.unauthorized();

	const service = getStudentAllowlistsService(c);
	const { inserted, skipped } = await service.importRows(validRows, user.id);

	return c.json(
		{
			totalRows,
			inserted,
			skipped,
			invalid: errors.length,
			errors,
		},
		201,
	);
};

export const listStudentAllowlists: RouteHandler<
	typeof listStudentAllowlistsRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getStudentAllowlistsService(c);
	const { rows, total } = await service.listOffset({
		page,
		perPage,
		search,
		sortField: sort,
		sortOrder: order,
	});

	return c.json(
		{
			data: rows,
			meta: createOffsetMeta({ total, page, perPage }),
		},
		200,
	);
};

export const listStudentAllowlistsCursor: RouteHandler<
	typeof listStudentAllowlistsCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getStudentAllowlistsService(c);
	const { rows, nextCursor, prevCursor, hasNext, hasPrev } =
		await service.listCursor({
			cursor: cursor ?? null,
			perPage,
			direction,
		});

	return c.json(
		{
			data: rows,
			meta: createCursorMeta({
				nextCursor,
				prevCursor,
				hasNext,
				hasPrev,
				perPage,
			}),
		},
		200,
	);
};
