ALTER TABLE "students" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "ext_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_students_course_id" ON "students" USING btree ("course_id");