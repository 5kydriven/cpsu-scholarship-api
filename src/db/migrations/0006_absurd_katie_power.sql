CREATE TABLE "student_allowlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_number" text NOT NULL,
	"name" text,
	"is_registered" boolean DEFAULT false NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_allowlist_student_number_unique" UNIQUE("student_number")
);
--> statement-breakpoint
ALTER TABLE "student_allowlist" ADD CONSTRAINT "student_allowlist_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;