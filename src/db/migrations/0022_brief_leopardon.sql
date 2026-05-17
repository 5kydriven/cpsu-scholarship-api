ALTER TABLE "applications" ADD COLUMN "year_level_at_approval" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "expected_graduation_sy" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "max_payout_sy" text;--> statement-breakpoint
ALTER TABLE "program_offerings" ADD COLUMN "amount_per_semester" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "program_offerings" ADD COLUMN "pwd_additional" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "is_scholar" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "one_approved_per_student" ON "applications" USING btree ("student_id") WHERE "applications"."status" = 'approved';--> statement-breakpoint
ALTER TABLE "program_offerings" ADD CONSTRAINT "chk_no_active_archived" CHECK (NOT ("program_offerings"."is_active" = true AND "program_offerings"."is_archived" = true));--> statement-breakpoint
COMMENT ON COLUMN "program_offerings"."amount_per_semester" IS 'Base payout amount per scholar per semester for this offering (e.g. 7000.00).';--> statement-breakpoint
COMMENT ON COLUMN "program_offerings"."pwd_additional" IS 'Additional amount added per semester for PWD-verified scholars (e.g. 2000.00). 0 if not applicable.';--> statement-breakpoint
COMMENT ON COLUMN "students"."is_scholar" IS 'True once any application for this student has been approved. Prevents re-application across all offerings and school years.';--> statement-breakpoint
COMMENT ON COLUMN "applications"."year_level_at_approval" IS 'Year level of the student at the time their application was approved (e.g. "3rd Year").';--> statement-breakpoint
COMMENT ON COLUMN "applications"."expected_graduation_sy" IS 'School year the student is expected to graduate based on year level at approval (e.g. "2025-2026").';--> statement-breakpoint
COMMENT ON COLUMN "applications"."max_payout_sy" IS 'Last school year this scholar is eligible to receive a payout. Payouts for offerings beyond this SY must be blocked.';--> statement-breakpoint
COMMENT ON INDEX "one_approved_per_student" IS 'Prevents any student from having more than one approved application, regardless of offering or school year.';--> statement-breakpoint
COMMENT ON CONSTRAINT "chk_no_active_archived" ON "program_offerings" IS 'An offering cannot be both active and archived at the same time.';
