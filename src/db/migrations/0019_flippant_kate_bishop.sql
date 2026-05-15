ALTER TABLE "applications" DROP CONSTRAINT "applications_reviewed_by_staff_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "reviewed_by" SET DATA TYPE text USING "reviewed_by"::text;--> statement-breakpoint
UPDATE "applications"
SET "reviewed_by" = "staff_profiles"."user_id"
FROM "staff_profiles"
WHERE "applications"."reviewed_by" = "staff_profiles"."id"::text;--> statement-breakpoint
UPDATE "applications"
SET "reviewed_by" = NULL
WHERE "reviewed_by" IS NOT NULL
AND NOT EXISTS (
	SELECT 1
	FROM "user"
	WHERE "user"."id" = "applications"."reviewed_by"
);--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
