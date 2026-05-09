import { Errors } from '@/lib/errors';
import type { CoursesRepo } from '@/repositories/courses.repo';

export const createCoursesService = (coursesRepo: CoursesRepo) => ({
	async getById(id: string) {
		const course = await coursesRepo.findById(id);
		if (!course) throw Errors.notFound('Course not found');
		return course;
	},

	async create(data: { name: string; abbreviation: string; major?: string }) {
		return coursesRepo.create({
			name: data.name,
			abbreviation: data.abbreviation,
			major: data.major,
		});
	},

	async update(
		id: string,
		data: Partial<{ name: string; abbreviation: string; major: string }>,
	) {
		const course = await coursesRepo.findById(id);
		if (!course) throw Errors.notFound('Course not found');
		return coursesRepo.update(id, data);
	},

	async delete(id: string) {
		const course = await coursesRepo.findById(id);
		if (!course) throw Errors.notFound('course not found');
		await coursesRepo.delete(id);
	},

	async listOffset(opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'name' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) {
		return coursesRepo.findManyOffset(opts);
	},

	async listCursor(opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) {
		return coursesRepo.findManyCursor(opts);
	},
});

export type coursesService = ReturnType<typeof createCoursesService>;
