CREATE TABLE "data_source_meta" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"source_url" varchar(500),
	"last_modified" varchar(100),
	"content_length" integer,
	"last_checked" timestamp,
	"last_changed" timestamp,
	"record_count" integer
);
--> statement-breakpoint
CREATE TABLE "email_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_hash" varchar(64) NOT NULL,
	"otp_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"verification_attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legislators" (
	"bioguide_id" varchar(10) PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text NOT NULL,
	"party" varchar(50) NOT NULL,
	"state" varchar(2) NOT NULL,
	"district" varchar(5),
	"chamber" varchar(10) NOT NULL,
	"title" varchar(50) NOT NULL,
	"term_start" varchar(10),
	"term_end" varchar(10),
	"phone_capitol" varchar(20),
	"phone_district" varchar(20),
	"fax" varchar(20),
	"address_capitol" text,
	"address_district" text,
	"contact_form_url" text,
	"website" text,
	"twitter_handle" varchar(50),
	"facebook_id" varchar(100),
	"youtube_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "moderation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"admin_id" uuid,
	"reason" text,
	"scores" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"suggested_by" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"user_id" uuid,
	"reason" varchar(50) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"issue_tags" json DEFAULT '[]'::json,
	"user_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"forked_from" uuid,
	"moderation_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"moderation_scores" json,
	"view_count" integer DEFAULT 0 NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"flag_count" integer DEFAULT 0 NOT NULL,
	"content_hash" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_slug_unique" UNIQUE("slug"),
	CONSTRAINT "templates_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "user_templates" (
	"user_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"bookmarked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_templates_user_id_template_id_pk" PRIMARY KEY("user_id","template_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_hash" varchar(64) NOT NULL,
	"trust_level" integer DEFAULT 0 NOT NULL,
	"approved_templates_count" integer DEFAULT 0 NOT NULL,
	"saved_district" varchar(5),
	"saved_state" varchar(2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_hash_unique" UNIQUE("email_hash")
);
--> statement-breakpoint
CREATE TABLE "zip_districts" (
	"zip" varchar(5) NOT NULL,
	"state" varchar(2) NOT NULL,
	"district" varchar(5) NOT NULL,
	"proportion" real NOT NULL,
	CONSTRAINT "zip_districts_zip_state_district_pk" PRIMARY KEY("zip","state","district")
);
--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_suggestions" ADD CONSTRAINT "tag_suggestions_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_suggestions" ADD CONSTRAINT "tag_suggestions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_flags" ADD CONSTRAINT "template_flags_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_flags" ADD CONSTRAINT "template_flags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_templates" ADD CONSTRAINT "user_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_templates" ADD CONSTRAINT "user_templates_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "legislators_state_idx" ON "legislators" USING btree ("state");--> statement-breakpoint
CREATE INDEX "legislators_state_district_idx" ON "legislators" USING btree ("state","district");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tag_suggestions_name_idx" ON "tag_suggestions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tag_suggestions_status_idx" ON "tag_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "template_flags_template_user_idx" ON "template_flags" USING btree ("template_id","user_id");--> statement-breakpoint
CREATE INDEX "templates_slug_idx" ON "templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "templates_public_idx" ON "templates" USING btree ("is_public","moderation_status");--> statement-breakpoint
CREATE INDEX "templates_user_id_idx" ON "templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "templates_moderation_idx" ON "templates" USING btree ("moderation_status");--> statement-breakpoint
CREATE INDEX "users_email_hash_idx" ON "users" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "zip_districts_zip_idx" ON "zip_districts" USING btree ("zip");