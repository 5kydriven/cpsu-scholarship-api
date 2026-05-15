CREATE TYPE "public"."application_status" AS ENUM('pending', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payout_semester" AS ENUM('1', '2');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'released');--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"semester" "payout_semester" NOT NULL,
	"amount" numeric(10, 2),
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"released_by" uuid,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "status" "application_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_released_by_staff_profiles_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_payouts_application_id" ON "payouts" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_payouts_status" ON "payouts" USING btree ("status");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewed_by_staff_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."staff_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_applications_status" ON "applications" USING btree ("status");