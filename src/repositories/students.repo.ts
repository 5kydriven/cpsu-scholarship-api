import type { Db } from '@/db';
import { student, user, type NewStudent } from '@/db/schema';
import { eq } from 'drizzle-orm';

type StudentProfileUpdate = Pick<
	NewStudent,
	'name' | 'firstName' | 'lastName' | 'middleName' | 'extName' | 'courseId'
>;

export const createStudentsRepo = (db: Db) => ({
	findByStudentNumber: (studentNumber: string) =>
		db
			.select()
			.from(student)
			.where(eq(student.studentNumber, studentNumber))
			.limit(1)
			.then((r) => r[0] ?? null),

	findByUserId: (userId: string) =>
		db
			.select()
			.from(student)
			.where(eq(student.userId, userId))
			.limit(1)
			.then((r) => r[0] ?? null),

	create: (data: NewStudent) =>
		db
			.insert(student)
			.values(data)
			.returning()
			.then((r) => r[0]),

	updateSubmittedProfile: (id: string, data: StudentProfileUpdate) =>
		db
			.update(student)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(student.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	delete: (id: string) =>
		db.delete(student).where(eq(student.id, id)).returning(),

	deleteUser: (userId: string) =>
		db.delete(user).where(eq(user.id, userId)).returning(),
});

export type StudentsRepo = ReturnType<typeof createStudentsRepo>;
