ALTER TABLE "payouts" ADD COLUMN "is_claimable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "claimable_by" uuid;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "claimable_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_claimable_by_staff_profiles_id_fk" FOREIGN KEY ("claimable_by") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;