CREATE TYPE "public"."program_status" AS ENUM('open', 'under_review', 'closed');--> statement-breakpoint
CREATE TABLE "scholarship_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_budget" numeric,
	"status" "program_status" DEFAULT 'open',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
