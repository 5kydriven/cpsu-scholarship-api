CREATE TYPE "public"."address_type" AS ENUM('permanent', 'current');--> statement-breakpoint
ALTER TABLE "program_offerings" DROP CONSTRAINT "program_offerings_program_id_scholarship_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "application_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "type" SET DATA TYPE "public"."address_type" USING "type"::"public"."address_type";--> statement-breakpoint
ALTER TABLE "parents" ALTER COLUMN "application_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "program_offerings" ADD CONSTRAINT "program_offerings_program_id_scholarship_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."scholarship_programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
