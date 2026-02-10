-- Create amendments table
CREATE TABLE "amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amendment_number" varchar(20) NOT NULL,
	"amendment_type" varchar(10) NOT NULL,
	"congress" integer NOT NULL,
	"chamber" varchar(10) NOT NULL,
	"description" text,
	"purpose" text,
	"latest_action_date" timestamp,
	"latest_action_text" text,
	"sponsor_bioguide_id" varchar(10),
	"amended_bill_id" uuid,
	"congress_gov_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amendments_congress_type_number_unique" UNIQUE("congress","amendment_type","amendment_number")
);

--> statement-breakpoint

-- Add foreign keys for amendments
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_sponsor_bioguide_id_legislators_bioguide_id_fk"
	FOREIGN KEY ("sponsor_bioguide_id") REFERENCES "public"."legislators"("bioguide_id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "amendments" ADD CONSTRAINT "amendments_amended_bill_id_bills_id_fk"
	FOREIGN KEY ("amended_bill_id") REFERENCES "public"."bills"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint

-- Add indexes for amendments
CREATE INDEX "amendments_amended_bill_id_idx" ON "amendments" USING btree ("amended_bill_id");

--> statement-breakpoint

CREATE INDEX "amendments_congress_idx" ON "amendments" USING btree ("congress");

--> statement-breakpoint

-- Add new columns to votes table
ALTER TABLE "votes" ADD COLUMN "bill_id" uuid;

--> statement-breakpoint

ALTER TABLE "votes" ADD COLUMN "amendment_id" uuid;

--> statement-breakpoint

ALTER TABLE "votes" ADD COLUMN "legislation_type" varchar(20);

--> statement-breakpoint

-- Add indexes for new vote columns
CREATE INDEX "votes_bill_id_idx" ON "votes" USING btree ("bill_id");

--> statement-breakpoint

CREATE INDEX "votes_amendment_id_idx" ON "votes" USING btree ("amendment_id");
