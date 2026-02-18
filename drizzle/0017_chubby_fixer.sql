CREATE TABLE "candidate_committees" (
	"fec_id" varchar(20) NOT NULL,
	"committee_id" varchar(20) NOT NULL,
	"cycle" varchar(4) NOT NULL,
	CONSTRAINT "candidate_committees_fec_id_cycle_pk" PRIMARY KEY("fec_id","cycle")
);
--> statement-breakpoint
CREATE TABLE "committees" (
	"fec_committee_id" varchar(20) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"designation" varchar(1),
	"committee_type" varchar(1),
	"party" varchar(3),
	"treasurer_name" text,
	"state" varchar(2),
	"source_url" text,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "independent_expenditures" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"bioguide_id" varchar(10) NOT NULL,
	"committee_id" varchar(20) NOT NULL,
	"fec_id" varchar(20) NOT NULL,
	"cycle" varchar(4) NOT NULL,
	"total_amount" real NOT NULL,
	"expenditure_count" integer NOT NULL,
	"support_oppose" varchar(1) NOT NULL,
	CONSTRAINT "independent_expenditures_bioguide_committee_cycle_so_unique" UNIQUE("bioguide_id","committee_id","cycle","support_oppose")
);
--> statement-breakpoint
CREATE TABLE "pac_contributions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"bioguide_id" varchar(10) NOT NULL,
	"committee_id" varchar(20) NOT NULL,
	"fec_id" varchar(20) NOT NULL,
	"recipient_committee_id" varchar(20),
	"cycle" varchar(4) NOT NULL,
	"total_amount" real NOT NULL,
	"contribution_count" integer NOT NULL,
	"last_contribution_date" timestamp,
	CONSTRAINT "pac_contributions_bioguide_committee_cycle_unique" UNIQUE("bioguide_id","committee_id","cycle")
);
--> statement-breakpoint
ALTER TABLE "candidate_committees" ADD CONSTRAINT "candidate_committees_committee_id_committees_fec_committee_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("fec_committee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "independent_expenditures" ADD CONSTRAINT "independent_expenditures_bioguide_id_legislators_bioguide_id_fk" FOREIGN KEY ("bioguide_id") REFERENCES "public"."legislators"("bioguide_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "independent_expenditures" ADD CONSTRAINT "independent_expenditures_committee_id_committees_fec_committee_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("fec_committee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pac_contributions" ADD CONSTRAINT "pac_contributions_bioguide_id_legislators_bioguide_id_fk" FOREIGN KEY ("bioguide_id") REFERENCES "public"."legislators"("bioguide_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pac_contributions" ADD CONSTRAINT "pac_contributions_committee_id_committees_fec_committee_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("fec_committee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "independent_expenditures_bioguide_id_idx" ON "independent_expenditures" USING btree ("bioguide_id");--> statement-breakpoint
CREATE INDEX "independent_expenditures_committee_id_idx" ON "independent_expenditures" USING btree ("committee_id");--> statement-breakpoint
CREATE INDEX "pac_contributions_bioguide_id_idx" ON "pac_contributions" USING btree ("bioguide_id");--> statement-breakpoint
CREATE INDEX "pac_contributions_committee_id_idx" ON "pac_contributions" USING btree ("committee_id");