import type { StudentsRepo } from '@/repositories/students.repo';

export const createStudentsService = (studentsRepo: StudentsRepo) => ({
	async findByStudentNumber(studentNumber: string) {
		return studentsRepo.findByStudentNumber(studentNumber);
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
		return studentsRepo.delete(id);
	},

	async deleteUser(userId: string) {
		return studentsRepo.deleteUser(userId);
	},
});
