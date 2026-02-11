ALTER TABLE "users" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "users" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "email_otps" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "email_otps" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "email_otps" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "email_otps" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "sessions" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "templates" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "template_flags" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "template_flags" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "template_flags" ADD CONSTRAINT "template_flags_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "template_flags" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "template_flags" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "moderation_log" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "moderation_log" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "moderation_log" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_log" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "issue_tags" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "issue_tags" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "issue_tags" ADD CONSTRAINT "issue_tags_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "issue_tags" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "issue_tags" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "votes" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "bills" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "amendments" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "amendments" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "amendments" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "amendments" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "template_uses" ADD COLUMN "v7_id" uuid;--> statement-breakpoint
UPDATE "template_uses" SET "v7_id" = uuid_timestamp_to_v7("created_at");--> statement-breakpoint
ALTER TABLE "template_uses" ADD CONSTRAINT "template_uses_v7_id_unique" UNIQUE ("v7_id");--> statement-breakpoint
ALTER TABLE "template_uses" ALTER COLUMN "v7_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "template_uses" ALTER COLUMN "v7_id" SET DEFAULT uuid_generate_v7();
