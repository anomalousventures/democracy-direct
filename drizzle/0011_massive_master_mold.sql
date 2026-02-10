CREATE TABLE "template_uses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"rep_bioguide_id" varchar(20) NOT NULL,
	"contact_type" varchar(20) NOT NULL,
	"visitor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "template_uses" ADD CONSTRAINT "template_uses_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "template_uses_dedup_idx" ON "template_uses" USING btree ("template_id","rep_bioguide_id","contact_type","visitor_id");--> statement-breakpoint
CREATE INDEX "template_uses_template_id_idx" ON "template_uses" USING btree ("template_id");