import { createSchemaFactory } from 'drizzle-zod';
import z from 'zod';

export const { createInsertSchema, createUpdateSchema, createSelectSchema } =
	createSchemaFactory({ zodInstance: z });
