-- Phase 1: Drop all 15 FK constraints
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "template_flags" DROP CONSTRAINT "template_flags_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "moderation_log" DROP CONSTRAINT "moderation_log_admin_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "issue_tags" DROP CONSTRAINT "tag_suggestions_suggested_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "issue_tags" DROP CONSTRAINT "tag_suggestions_approved_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_templates" DROP CONSTRAINT "user_templates_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "template_flags" DROP CONSTRAINT "template_flags_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "moderation_log" DROP CONSTRAINT "moderation_log_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "template_issue_tags" DROP CONSTRAINT "template_issue_tags_template_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_templates" DROP CONSTRAINT "user_templates_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "template_uses" DROP CONSTRAINT "template_uses_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "member_votes" DROP CONSTRAINT "member_votes_vote_id_votes_id_fk";
--> statement-breakpoint
ALTER TABLE "amendments" DROP CONSTRAINT "amendments_amended_bill_id_bills_id_fk";
--> statement-breakpoint
ALTER TABLE "template_issue_tags" DROP CONSTRAINT "template_issue_tags_issue_tag_id_fkey";
--> statement-breakpoint

-- Phase 2: Drop 3 composite PKs (contain FK columns)
--> statement-breakpoint
ALTER TABLE "member_votes" DROP CONSTRAINT "member_votes_vote_id_bioguide_id_pk";
--> statement-breakpoint
ALTER TABLE "user_templates" DROP CONSTRAINT "user_templates_user_id_template_id_pk";
--> statement-breakpoint
ALTER TABLE "template_issue_tags" DROP CONSTRAINT "template_issue_tags_pkey";
--> statement-breakpoint

-- Phase 3: Drop 11 single-column PKs
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
--> statement-breakpoint
ALTER TABLE "email_otps" DROP CONSTRAINT "email_otps_pkey";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT "templates_pkey";
--> statement-breakpoint
ALTER TABLE "template_flags" DROP CONSTRAINT "template_flags_pkey";
--> statement-breakpoint
ALTER TABLE "moderation_log" DROP CONSTRAINT "moderation_log_pkey";
--> statement-breakpoint
ALTER TABLE "issue_tags" DROP CONSTRAINT "tag_suggestions_pkey";
--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_pkey";
--> statement-breakpoint
ALTER TABLE "bills" DROP CONSTRAINT "bills_pkey";
--> statement-breakpoint
ALTER TABLE "amendments" DROP CONSTRAINT "amendments_pkey";
--> statement-breakpoint
ALTER TABLE "template_uses" DROP CONSTRAINT "template_uses_pkey";
--> statement-breakpoint

-- Phase 4: Update 18 FK columns via UPDATE ... FROM ... WHERE
--> statement-breakpoint
UPDATE "sessions" SET "user_id" = u."v7_id" FROM "users" u WHERE "sessions"."user_id" = u."id";
--> statement-breakpoint
UPDATE "templates" SET "user_id" = u."v7_id" FROM "users" u WHERE "templates"."user_id" = u."id";
--> statement-breakpoint
UPDATE "template_flags" SET "user_id" = u."v7_id" FROM "users" u WHERE "template_flags"."user_id" = u."id";
--> statement-breakpoint
UPDATE "moderation_log" SET "admin_id" = u."v7_id" FROM "users" u WHERE "moderation_log"."admin_id" = u."id";
--> statement-breakpoint
UPDATE "issue_tags" SET "suggested_by" = u."v7_id" FROM "users" u WHERE "issue_tags"."suggested_by" = u."id";
--> statement-breakpoint
UPDATE "issue_tags" SET "approved_by" = u."v7_id" FROM "users" u WHERE "issue_tags"."approved_by" = u."id";
--> statement-breakpoint
UPDATE "user_templates" SET "user_id" = u."v7_id" FROM "users" u WHERE "user_templates"."user_id" = u."id";
--> statement-breakpoint
UPDATE "template_flags" SET "template_id" = t."v7_id" FROM "templates" t WHERE "template_flags"."template_id" = t."id";
--> statement-breakpoint
UPDATE "moderation_log" SET "template_id" = t."v7_id" FROM "templates" t WHERE "moderation_log"."template_id" = t."id";
--> statement-breakpoint
UPDATE "template_issue_tags" SET "template_id" = t."v7_id" FROM "templates" t WHERE "template_issue_tags"."template_id" = t."id";
--> statement-breakpoint
UPDATE "user_templates" SET "template_id" = t."v7_id" FROM "templates" t WHERE "user_templates"."template_id" = t."id";
--> statement-breakpoint
UPDATE "template_uses" SET "template_id" = t."v7_id" FROM "templates" t WHERE "template_uses"."template_id" = t."id";
--> statement-breakpoint
UPDATE "member_votes" SET "vote_id" = v."v7_id" FROM "votes" v WHERE "member_votes"."vote_id" = v."id";
--> statement-breakpoint
UPDATE "amendments" SET "amended_bill_id" = b."v7_id" FROM "bills" b WHERE "amendments"."amended_bill_id" = b."id";
--> statement-breakpoint
UPDATE "template_issue_tags" SET "issue_tag_id" = it."v7_id" FROM "issue_tags" it WHERE "template_issue_tags"."issue_tag_id" = it."id";
--> statement-breakpoint
UPDATE "votes" SET "bill_id" = b."v7_id" FROM "bills" b WHERE "votes"."bill_id" = b."id";
--> statement-breakpoint
UPDATE "votes" SET "amendment_id" = a."v7_id" FROM "amendments" a WHERE "votes"."amendment_id" = a."id";
--> statement-breakpoint
UPDATE "templates" SET "forked_from" = t2."v7_id" FROM "templates" t2 WHERE "templates"."forked_from" = t2."id";
--> statement-breakpoint

-- Phase 5: Copy v7_id → id for all 11 tables
--> statement-breakpoint
UPDATE "users" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "email_otps" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "sessions" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "templates" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "template_flags" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "moderation_log" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "issue_tags" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "votes" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "bills" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "amendments" SET "id" = "v7_id";
--> statement-breakpoint
UPDATE "template_uses" SET "id" = "v7_id";
--> statement-breakpoint

-- Phase 6: Change defaults to uuid_generate_v7()
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "email_otps" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "template_flags" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "moderation_log" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "issue_tags" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "amendments" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint
ALTER TABLE "template_uses" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
--> statement-breakpoint

-- Phase 7: Restore 11 single-column PKs
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "template_flags" ADD CONSTRAINT "template_flags_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "issue_tags" ADD CONSTRAINT "tag_suggestions_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "template_uses" ADD CONSTRAINT "template_uses_pkey" PRIMARY KEY ("id");
--> statement-breakpoint

-- Phase 8: Restore 3 composite PKs
--> statement-breakpoint
ALTER TABLE "member_votes" ADD CONSTRAINT "member_votes_vote_id_bioguide_id_pk" PRIMARY KEY ("vote_id", "bioguide_id");
--> statement-breakpoint
ALTER TABLE "user_templates" ADD CONSTRAINT "user_templates_user_id_template_id_pk" PRIMARY KEY ("user_id", "template_id");
--> statement-breakpoint
ALTER TABLE "template_issue_tags" ADD CONSTRAINT "template_issue_tags_pkey" PRIMARY KEY ("template_id", "issue_tag_id");
--> statement-breakpoint

-- Phase 9: Restore 15 FK constraints
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "template_flags" ADD CONSTRAINT "template_flags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "issue_tags" ADD CONSTRAINT "tag_suggestions_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "issue_tags" ADD CONSTRAINT "tag_suggestions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "user_templates" ADD CONSTRAINT "user_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "template_flags" ADD CONSTRAINT "template_flags_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "template_issue_tags" ADD CONSTRAINT "template_issue_tags_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "user_templates" ADD CONSTRAINT "user_templates_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "template_uses" ADD CONSTRAINT "template_uses_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "member_votes" ADD CONSTRAINT "member_votes_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "votes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_amended_bill_id_bills_id_fk" FOREIGN KEY ("amended_bill_id") REFERENCES "bills"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "template_issue_tags" ADD CONSTRAINT "template_issue_tags_issue_tag_id_fkey" FOREIGN KEY ("issue_tag_id") REFERENCES "issue_tags"("id") ON DELETE CASCADE;
--> statement-breakpoint

-- Phase 10: Drop 11 v7_id columns (cascades drop UNIQUE constraints)
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "email_otps" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "template_flags" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "moderation_log" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "issue_tags" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "votes" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "bills" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "amendments" DROP COLUMN "v7_id";
--> statement-breakpoint
ALTER TABLE "template_uses" DROP COLUMN "v7_id";
