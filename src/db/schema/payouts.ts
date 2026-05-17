import { relations } from 'drizzle-orm';
import {
	boolean,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { applications } from './applications';
import { staffProfiles } from './staff_profiles';

export const payoutSemesterEnum = pgEnum('payout_semester', ['1', '2']);

export const payoutStatusEnum = pgEnum('payout_status', [
	'pending',
	'released',
]);

export const payouts = pgTable(
	'payouts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		applicationId: uuid('application_id')
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		semester: payoutSemesterEnum('semester').notNull(),
		amount: numeric('amount', { precision: 10, scale: 2 }),
		status: payoutStatusEnum('status').default('pending').notNull(),
		isClaimable: boolean('is_claimable').notNull().default(false),
		claimableBy: uuid('claimable_by').references(() => staffProfiles.id),
		claimableAt: timestamp('claimable_at', {
			withTimezone: true,
			mode: 'string',
		}),
		checkNo: text('check_no'),
		checkImageUrl: text('check_image_url'),
		releasedBy: uuid('released_by').references(() => staffProfiles.id),
		releasedAt: timestamp('released_at', {
			withTimezone: true,
			mode: 'string',
		}),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index('idx_payouts_application_id').on(table.applicationId),
		index('idx_payouts_status').on(table.status),
	],
);

export const payoutsRelations = relations(payouts, ({ one }) => ({
	application: one(applications, {
		fields: [payouts.applicationId],
		references: [applications.id],
	}),
	releasedByStaff: one(staffProfiles, {
		fields: [payouts.releasedBy],
		references: [staffProfiles.id],
	}),
	claimableByStaff: one(staffProfiles, {
		fields: [payouts.claimableBy],
		references: [staffProfiles.id],
	}),
}));

export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
