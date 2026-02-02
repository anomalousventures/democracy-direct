ALTER TABLE "bills" ALTER COLUMN "subjects" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "subjects" SET DEFAULT '[]'::jsonb;