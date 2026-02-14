CREATE TABLE "campaign_finance" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"bioguide_id" varchar(10) NOT NULL,
	"fec_id" varchar(20) NOT NULL,
	"cycle" varchar(4) NOT NULL,
	"total_receipts" real NOT NULL,
	"total_disbursements" real NOT NULL,
	"cash_on_hand" real NOT NULL,
	"total_from_pacs" real NOT NULL,
	"total_from_individuals" real NOT NULL,
	"debts_owed" real,
	"source_url" text,
	"last_updated" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_finance_bioguide_cycle_unique" UNIQUE("bioguide_id","cycle")
);
--> statement-breakpoint
ALTER TABLE "amendments" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "email_otps" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "issue_tags" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "moderation_log" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "template_flags" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "template_uses" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "legislators" ADD COLUMN "fec_ids" text[];--> statement-breakpoint
ALTER TABLE "campaign_finance" ADD CONSTRAINT "campaign_finance_bioguide_id_legislators_bioguide_id_fk" FOREIGN KEY ("bioguide_id") REFERENCES "public"."legislators"("bioguide_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_finance_bioguide_id_idx" ON "campaign_finance" USING btree ("bioguide_id");