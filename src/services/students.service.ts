import { Errors } from '@/lib/errors';
import type { StudentsRepo } from '@/repositories/students.repo';

export const createStudentsService = (studentsRepo: StudentsRepo) => ({
	async findByStudentNumber(studentNumber: string) {
		return studentsRepo.findByStudentNumber(studentNumber);
	},

	async findByUserId(userId: string) {
		return studentsRepo.findByUserId(userId);
	},

	async create(data: {
		userId: string;
		studentNumber: string;
		name: string;
		email: string;
	}) {
		return studentsRepo.create(data);
	},

	async delete(id: string) {
		const student = await studentsRepo.delete(id);
		if (!student) throw Errors.notFound('Student not found');
		return student;
	},

	async deleteUser(userId: string) {
		const user = studentsRepo.deleteUser(userId);
		if (!user) throw Errors.notFound('User not found');
		return user;
	},
});
