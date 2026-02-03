CREATE TABLE "member_votes" (
	"vote_id" uuid NOT NULL,
	"bioguide_id" varchar(10) NOT NULL,
	"position" varchar(20) NOT NULL,
	CONSTRAINT "member_votes_vote_id_bioguide_id_pk" PRIMARY KEY("vote_id","bioguide_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roll_call" integer NOT NULL,
	"chamber" varchar(10) NOT NULL,
	"congress" integer NOT NULL,
	"session" integer NOT NULL,
	"date" timestamp NOT NULL,
	"question" text NOT NULL,
	"result" varchar(100) NOT NULL,
	"bill_number" varchar(50),
	"bill_title" text,
	"bill_subjects" json,
	"source_url" text NOT NULL,
	"yeas" integer DEFAULT 0 NOT NULL,
	"nays" integer DEFAULT 0 NOT NULL,
	"not_voting" integer DEFAULT 0 NOT NULL,
	"present" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "votes_chamber_congress_session_rollcall_unique" UNIQUE("chamber","congress","session","roll_call")
);
--> statement-breakpoint
ALTER TABLE "legislators" ADD COLUMN "lis_id" varchar(10);--> statement-breakpoint
ALTER TABLE "member_votes" ADD CONSTRAINT "member_votes_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_votes" ADD CONSTRAINT "member_votes_bioguide_id_legislators_bioguide_id_fk" FOREIGN KEY ("bioguide_id") REFERENCES "public"."legislators"("bioguide_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_votes_bioguide_id_idx" ON "member_votes" USING btree ("bioguide_id");--> statement-breakpoint
CREATE INDEX "votes_chamber_congress_idx" ON "votes" USING btree ("chamber","congress");--> statement-breakpoint
CREATE INDEX "votes_date_idx" ON "votes" USING btree ("date");