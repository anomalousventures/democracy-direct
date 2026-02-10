ALTER TABLE "sync_cursors" ADD COLUMN IF NOT EXISTS "current_sync_congress" integer;--> statement-breakpoint
ALTER TABLE "sync_cursors" ADD COLUMN IF NOT EXISTS "current_offset" integer;