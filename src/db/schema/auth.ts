import { boolean, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
	'admin',
	'personnel',
	'student',
]);

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	role: userRoleEnum('role').notNull().default('student'),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', {
		withTimezone: true,
		mode: 'string',
	}),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
		withTimezone: true,
		mode: 'string',
	}),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'string',
	}).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
});

export type AuthUser = typeof user.$inferSelect;
export type AuthSession = typeof session.$inferSelect;
