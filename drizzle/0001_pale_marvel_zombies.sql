CREATE TYPE "public"."model_lifecycle" AS ENUM('discovered', 'candidate', 'verified', 'published', 'archived');--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "lifecycle" "model_lifecycle" DEFAULT 'discovered' NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "admin_approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "release_date" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD COLUMN "discovered_models" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD COLUMN "published_models" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD COLUMN "source_success_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD COLUMN "source_failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD COLUMN "coverage" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "pipeline_runs" ADD COLUMN "commit_sha" text;--> statement-breakpoint
ALTER TABLE "ranking_entries" ADD COLUMN "movement_reason" text;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "benchmark_name" text DEFAULT 'Legacy observation' NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "benchmark_version" text;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "external_model_id" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "unit" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "fetched_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "adapter_version" text DEFAULT 'v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "raw_payload_hash" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD COLUMN "license_terms_note" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "terms_url" text;
