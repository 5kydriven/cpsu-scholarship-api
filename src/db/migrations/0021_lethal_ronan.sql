CREATE TABLE "eligibility_suggestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"generated_by" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"criteria_snapshot" jsonb NOT NULL,
	"suggested_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eligibility_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"gwa" numeric(4, 2) NOT NULL,
	"annual_family_income" numeric(12, 2) NOT NULL,
	"priority_proofs" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eligibility_suggestion_runs" ADD CONSTRAINT "eligibility_suggestion_runs_offering_id_program_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."program_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_suggestion_runs" ADD CONSTRAINT "eligibility_suggestion_runs_generated_by_user_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_suggestions" ADD CONSTRAINT "eligibility_suggestions_run_id_eligibility_suggestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."eligibility_suggestion_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_suggestions" ADD CONSTRAINT "eligibility_suggestions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "eligibility_suggestion_runs_offering_id_unique" ON "eligibility_suggestion_runs" USING btree ("offering_id");--> statement-breakpoint
CREATE INDEX "idx_eligibility_suggestion_runs_generated_by" ON "eligibility_suggestion_runs" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "idx_eligibility_suggestions_run_id" ON "eligibility_suggestions" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_eligibility_suggestions_application_id" ON "eligibility_suggestions" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "eligibility_suggestions_run_rank_unique" ON "eligibility_suggestions" USING btree ("run_id","rank");--> statement-breakpoint
CREATE UNIQUE INDEX "eligibility_suggestions_run_application_unique" ON "eligibility_suggestions" USING btree ("run_id","application_id");