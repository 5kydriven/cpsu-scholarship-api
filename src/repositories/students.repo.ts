import type { Db } from '@/db';
import { student, user, type NewStudent } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const createStudentsRepo = (db: Db) => ({
	findByStudentNumber: (studentNumber: string) =>
		db
			.select()
			.from(student)
			.where(eq(student.studentNumber, studentNumber))
			.limit(1)
			.then((r) => r[0] ?? null),

	create: (data: NewStudent) =>
		db
			.insert(student)
			.values(data)
			.returning()
			.then((r) => r[0]),

	delete: (id: string) =>
		db.delete(student).where(eq(student.id, id)).returning(),

	deleteUser: (userId: string) =>
		db.delete(user).where(eq(user.id, userId)).returning(),
});

export type StudentsRepo = ReturnType<typeof createStudentsRepo>;
