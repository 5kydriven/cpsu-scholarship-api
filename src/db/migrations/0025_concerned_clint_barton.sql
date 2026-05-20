CREATE INDEX "idx_applications_status_offering_id" ON "applications" USING btree ("status","offering_id");--> statement-breakpoint
CREATE INDEX "idx_applications_status_course_id" ON "applications" USING btree ("status","course_id");--> statement-breakpoint
CREATE INDEX "idx_applications_offering_created_at" ON "applications" USING btree ("offering_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_applications_status_reviewed_at" ON "applications" USING btree ("status","reviewed_at");--> statement-breakpoint
CREATE INDEX "idx_students_is_scholar_true" ON "students" USING btree ("id") WHERE "students"."is_scholar" = true;--> statement-breakpoint
CREATE INDEX "idx_student_allowlist_is_registered_true" ON "student_allowlist" USING btree ("id") WHERE "student_allowlist"."is_registered" = true;