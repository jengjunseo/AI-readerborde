CREATE TYPE "public"."run_status" AS ENUM('running', 'degraded', 'failed', 'published');--> statement-breakpoint
CREATE TYPE "public"."snapshot_status" AS ENUM('staged', 'validated', 'published', 'superseded');--> statement-breakpoint
CREATE TABLE "board_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"model_version_id" uuid NOT NULL,
	"board_slug" text NOT NULL,
	"score" numeric NOT NULL,
	"coverage" numeric NOT NULL,
	"method_version" text NOT NULL,
	"breakdown" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_key" text NOT NULL,
	"external_id" text NOT NULL,
	"model_version_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"version" text NOT NULL,
	"context_length" numeric NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "normalized_metric_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"model_version_id" uuid NOT NULL,
	"metric_key" text NOT NULL,
	"normalized_value" numeric NOT NULL,
	"method_version" text NOT NULL,
	"raw_observation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"run_date" text NOT NULL,
	"status" "run_status" NOT NULL,
	"input_hash" text,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "pipeline_runs_run_date_unique" UNIQUE("run_date")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "published_pointers" (
	"board_slug" text PRIMARY KEY NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranking_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"model_version_id" uuid NOT NULL,
	"rank" numeric NOT NULL,
	"value" numeric NOT NULL,
	"previous_rank" numeric,
	"is_new" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranking_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"board_slug" text NOT NULL,
	"snapshot_date" text NOT NULL,
	"method_version" text NOT NULL,
	"input_hash" text NOT NULL,
	"status" "snapshot_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"model_version_id" uuid NOT NULL,
	"metric_key" text NOT NULL,
	"value" numeric NOT NULL,
	"source_url" text NOT NULL,
	"observed_at" text NOT NULL,
	"source_fetch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_fetches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_run_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"fingerprint" text,
	"payload" jsonb NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"homepage_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "unmapped_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_key" text NOT NULL,
	"external_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"first_seen_run_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_scores" ADD CONSTRAINT "board_scores_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_scores" ADD CONSTRAINT "board_scores_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_aliases" ADD CONSTRAINT "model_aliases_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_metric_values" ADD CONSTRAINT "normalized_metric_values_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_metric_values" ADD CONSTRAINT "normalized_metric_values_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_metric_values" ADD CONSTRAINT "normalized_metric_values_raw_observation_id_raw_observations_id_fk" FOREIGN KEY ("raw_observation_id") REFERENCES "public"."raw_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_pointers" ADD CONSTRAINT "published_pointers_snapshot_id_ranking_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."ranking_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_snapshot_id_ranking_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."ranking_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD CONSTRAINT "raw_observations_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD CONSTRAINT "raw_observations_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_observations" ADD CONSTRAINT "raw_observations_source_fetch_id_source_fetches_id_fk" FOREIGN KEY ("source_fetch_id") REFERENCES "public"."source_fetches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_fetches" ADD CONSTRAINT "source_fetches_pipeline_run_id_pipeline_runs_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_fetches" ADD CONSTRAINT "source_fetches_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unmapped_entities" ADD CONSTRAINT "unmapped_entities_first_seen_run_id_pipeline_runs_id_fk" FOREIGN KEY ("first_seen_run_id") REFERENCES "public"."pipeline_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "board_scores_run_version_board" ON "board_scores" USING btree ("pipeline_run_id","model_version_id","board_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "model_aliases_source_external" ON "model_aliases" USING btree ("source_key","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "model_versions_model_version" ON "model_versions" USING btree ("model_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "normalized_values_run_version_metric" ON "normalized_metric_values" USING btree ("pipeline_run_id","model_version_id","metric_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_entries_snapshot_version" ON "ranking_entries" USING btree ("snapshot_id","model_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_snapshots_run_board" ON "ranking_snapshots" USING btree ("pipeline_run_id","board_slug");--> statement-breakpoint
CREATE INDEX "raw_observations_run_metric" ON "raw_observations" USING btree ("pipeline_run_id","metric_key");--> statement-breakpoint
CREATE UNIQUE INDEX "unmapped_entities_source_external" ON "unmapped_entities" USING btree ("source_key","external_id");