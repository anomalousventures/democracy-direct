ALTER TABLE "tag_suggestions" RENAME TO "issue_tags";--> statement-breakpoint
ALTER INDEX "tag_suggestions_name_idx" RENAME TO "issue_tags_name_idx";--> statement-breakpoint
ALTER INDEX "tag_suggestions_status_idx" RENAME TO "issue_tags_status_idx";--> statement-breakpoint
ALTER TABLE "issue_tags" ADD CONSTRAINT "issue_tags_name_unique" UNIQUE ("name");--> statement-breakpoint
INSERT INTO "issue_tags" ("name", "status", "created_at", "updated_at")
VALUES
  ('healthcare', 'approved', NOW(), NOW()),
  ('education', 'approved', NOW(), NOW()),
  ('environment', 'approved', NOW(), NOW()),
  ('economy', 'approved', NOW(), NOW()),
  ('immigration', 'approved', NOW(), NOW()),
  ('civil rights', 'approved', NOW(), NOW()),
  ('gun policy', 'approved', NOW(), NOW()),
  ('foreign policy', 'approved', NOW(), NOW()),
  ('social security', 'approved', NOW(), NOW()),
  ('infrastructure', 'approved', NOW(), NOW()),
  ('veterans affairs', 'approved', NOW(), NOW()),
  ('housing', 'approved', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
