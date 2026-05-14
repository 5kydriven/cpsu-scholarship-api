import type { NewCourse } from '@/db/schema';
import { Errors } from '@/lib/errors';
import type { CoursesRepo } from '@/repositories/courses.repo';

export const createCoursesService = (coursesRepo: CoursesRepo) => ({
	async getById(id: string) {
		const course = await coursesRepo.findById(id);
		if (!course) throw Errors.notFound('Course not found');
		return course;
	},

	async create(data: NewCourse) {
		return coursesRepo.create({
			name: data.name,
			abbreviation: data.abbreviation,
			major: data.major,
		});
	},

	async update(id: string, data: Partial<NewCourse>) {
		const course = await coursesRepo.update(id, data);
		if (!course) throw Errors.notFound('Course not found');
		return course;
	},

	async delete(id: string) {
		const course = await coursesRepo.delete(id);
		if (!course) throw Errors.notFound('Course not found');
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

export type CoursesService = ReturnType<typeof createCoursesService>;
