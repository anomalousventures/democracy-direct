CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_number" varchar(50) NOT NULL,
	"bill_type" varchar(10) NOT NULL,
	"congress" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"status" varchar(30) NOT NULL,
	"subjects" json DEFAULT '[]'::json,
	"introduced_date" timestamp NOT NULL,
	"latest_action_date" timestamp NOT NULL,
	"latest_action_text" text NOT NULL,
	"sponsor_bioguide_id" varchar(10),
	"congress_gov_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bills_congress_type_number_unique" UNIQUE("congress","bill_type","bill_number")
);
--> statement-breakpoint
CREATE TABLE "sync_cursors" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"cursor" text,
	"oldest_congress" integer,
	"newest_congress" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_sponsor_bioguide_id_legislators_bioguide_id_fk" FOREIGN KEY ("sponsor_bioguide_id") REFERENCES "public"."legislators"("bioguide_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bills_sponsor_bioguide_id_idx" ON "bills" USING btree ("sponsor_bioguide_id");--> statement-breakpoint
CREATE INDEX "bills_congress_latest_action_idx" ON "bills" USING btree ("congress","latest_action_date");