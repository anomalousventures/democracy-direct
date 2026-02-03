-- Enable pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

--> statement-breakpoint

-- Create junction table
CREATE TABLE "template_issue_tags" (
  "template_id" uuid NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
  "issue_tag_id" uuid NOT NULL REFERENCES "issue_tags"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("template_id", "issue_tag_id")
);

--> statement-breakpoint

-- Indexes for junction table
CREATE INDEX "template_issue_tags_template_id_idx" ON "template_issue_tags" ("template_id");

--> statement-breakpoint

CREATE INDEX "template_issue_tags_issue_tag_id_idx" ON "template_issue_tags" ("issue_tag_id");

--> statement-breakpoint

-- Trigram indexes for text search on templates
CREATE INDEX "templates_title_trgm_idx" ON "templates" USING gin ("title" gin_trgm_ops);

--> statement-breakpoint

CREATE INDEX "templates_description_trgm_idx" ON "templates" USING gin ("description" gin_trgm_ops);

--> statement-breakpoint

-- Index for popularity sort (views + uses, then created_at)
CREATE INDEX "templates_popularity_idx" ON "templates"
  ((view_count + use_count) DESC, created_at DESC, id DESC)
  WHERE is_public = true AND moderation_status = 'approved';

--> statement-breakpoint

-- Migrate existing JSON data to junction table
INSERT INTO "template_issue_tags" ("template_id", "issue_tag_id", "created_at")
SELECT
  t.id,
  it.id,
  t.created_at
FROM templates t
CROSS JOIN LATERAL jsonb_array_elements_text(t.issue_tags::jsonb) AS tag_name
INNER JOIN issue_tags it ON LOWER(it.name) = LOWER(tag_name)
ON CONFLICT DO NOTHING;
