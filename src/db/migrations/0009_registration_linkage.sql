ALTER TABLE "student_allowlist"
ADD COLUMN "registered_user_id" text,
ADD COLUMN "registered_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "student_allowlist"
ADD CONSTRAINT "student_allowlist_registered_user_id_user_id_fk"
FOREIGN KEY ("registered_user_id")
REFERENCES "user"("id")
ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "student_allowlist_registered_user_id_unique"
ON "student_allowlist" ("registered_user_id");
--> statement-breakpoint
ALTER TABLE "applications"
DROP CONSTRAINT IF EXISTS "applications_student_id_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "applications_student_id_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "applications_student_id_offering_id_unique"
ON "applications" ("student_id", "offering_id");
--> statement-breakpoint
ALTER TABLE "applications"
ALTER COLUMN "offering_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "idx_applications_offering_id"
ON "applications" ("offering_id");
--> statement-breakpoint
CREATE INDEX "idx_applications_course_id"
ON "applications" ("course_id");
--> statement-breakpoint
CREATE INDEX "idx_addresses_application_id"
ON "addresses" ("application_id");
--> statement-breakpoint
CREATE INDEX "idx_parents_application_id"
ON "parents" ("application_id");
--> statement-breakpoint
CREATE INDEX "idx_program_offerings_program_id"
ON "program_offerings" ("program_id");
--> statement-breakpoint
CREATE INDEX "idx_students_email"
ON "students" ("email");
