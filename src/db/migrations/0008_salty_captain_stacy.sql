CREATE TYPE "public"."parent_type" AS ENUM('mother', 'father', 'guardian');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"type" text NOT NULL,
	"province" text NOT NULL,
	"city_municipality" text NOT NULL,
	"barangay" text NOT NULL,
	"street" text,
	"zip_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"offering_id" uuid,
	"course_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"ext_name" text,
	"gender" text NOT NULL,
	"birthdate" text NOT NULL,
	"year_level" text NOT NULL,
	"gwa" text NOT NULL,
	"citizenship" text,
	"birthplace" text,
	"email" text NOT NULL,
	"number_of_siblings" text,
	"contact_number" text NOT NULL,
	"school_sector" text,
	"school_name" text,
	"school_address" text,
	"other_financial_assistance" text,
	"pwd_url" text,
	"ip_url" text,
	"fourps_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"is_deceased" text,
	"type" "parent_type" NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"ext_name" text,
	"occupation" text,
	"monthly_income" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid,
	"school_year" text NOT NULL,
	"total_budget" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scholarship_programs" ADD COLUMN "is_archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_offering_id_program_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."program_offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_offerings" ADD CONSTRAINT "program_offerings_program_id_scholarship_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."scholarship_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_programs" DROP COLUMN "total_budget";--> statement-breakpoint
ALTER TABLE "scholarship_programs" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."program_status";
