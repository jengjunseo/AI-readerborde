CREATE TYPE "public"."guide_status" AS ENUM('pending', 'verified', 'published');--> statement-breakpoint
CREATE TABLE "model_guide_families" (
	"family_key" text PRIMARY KEY NOT NULL,
	"official_name" text NOT NULL,
	"provider_name" text NOT NULL,
	"content" jsonb NOT NULL,
	"sources" jsonb NOT NULL,
	"status" "guide_status" DEFAULT 'pending' NOT NULL,
	"last_verified_at" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_version_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_version_id" uuid NOT NULL,
	"family_key" text NOT NULL,
	"content" jsonb NOT NULL,
	"sources" jsonb NOT NULL,
	"status" "guide_status" DEFAULT 'pending' NOT NULL,
	"last_verified_at" text,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_version_guides" ADD CONSTRAINT "model_version_guides_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_version_guides" ADD CONSTRAINT "model_version_guides_family_key_model_guide_families_family_key_fk" FOREIGN KEY ("family_key") REFERENCES "public"."model_guide_families"("family_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "model_version_guides_version" ON "model_version_guides" USING btree ("model_version_id");