import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  index,
  primaryKey,
  timestamp,
  uuid,
  boolean,
  json,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import type { BillStatus, BillType, Chamber, VotePosition } from "@/lib/types/legislation";

export const legislators = pgTable(
  "legislators",
  {
    bioguideId: varchar("bioguide_id", { length: 10 }).primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name").notNull(),
    party: varchar("party", { length: 50 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    district: varchar("district", { length: 5 }),
    chamber: varchar("chamber", { length: 10 }).notNull(),
    title: varchar("title", { length: 50 }).notNull(),
    termStart: varchar("term_start", { length: 10 }),
    termEnd: varchar("term_end", { length: 10 }),
    phoneCapitol: varchar("phone_capitol", { length: 20 }),
    phoneDistrict: varchar("phone_district", { length: 20 }),
    fax: varchar("fax", { length: 20 }),
    addressCapitol: text("address_capitol"),
    addressDistrict: text("address_district"),
    contactFormUrl: text("contact_form_url"),
    website: text("website"),
    twitterHandle: varchar("twitter_handle", { length: 50 }),
    facebookId: varchar("facebook_id", { length: 100 }),
    youtubeId: varchar("youtube_id", { length: 100 }),
    lisId: varchar("lis_id", { length: 10 }),
  },
  (table) => [
    index("legislators_state_idx").on(table.state),
    index("legislators_state_district_idx").on(table.state, table.district),
  ]
);

export const zipDistricts = pgTable(
  "zip_districts",
  {
    zip: varchar("zip", { length: 5 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    district: varchar("district", { length: 5 }).notNull(),
    proportion: real("proportion").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.zip, table.state, table.district] }),
    index("zip_districts_zip_idx").on(table.zip),
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    emailHash: varchar("email_hash", { length: 64 }).notNull().unique(),
    trustLevel: integer("trust_level").notNull().default(0),
    approvedTemplatesCount: integer("approved_templates_count").notNull().default(0),
    savedDistrict: varchar("saved_district", { length: 5 }),
    savedState: varchar("saved_state", { length: 2 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("users_email_hash_idx").on(table.emailHash)]
);

export const emailOtps = pgTable("email_otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailHash: varchar("email_hash", { length: 64 }).notNull(),
  otpHash: varchar("otp_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  verificationAttempts: integer("verification_attempts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: varchar("description", { length: 200 }),
    body: text("body").notNull(),
    issueTags: json("issue_tags").$type<string[]>().default([]),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    isPublic: boolean("is_public").notNull().default(false),
    forkedFrom: uuid("forked_from"),
    moderationStatus: varchar("moderation_status", { length: 20 }).notNull().default("pending"),
    moderationScores: json("moderation_scores").$type<Record<string, number>>(),
    viewCount: integer("view_count").notNull().default(0),
    useCount: integer("use_count").notNull().default(0),
    flagCount: integer("flag_count").notNull().default(0),
    contentHash: varchar("content_hash", { length: 64 }).unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("templates_slug_idx").on(table.slug),
    index("templates_public_idx").on(table.isPublic, table.moderationStatus),
    index("templates_user_id_idx").on(table.userId),
    index("templates_moderation_idx").on(table.moderationStatus),
  ]
);

export const templateFlags = pgTable(
  "template_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    reason: varchar("reason", { length: 50 }).notNull(),
    details: text("details"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("template_flags_template_user_idx").on(table.templateId, table.userId)]
);

export const moderationLog = pgTable("moderation_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => templates.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 20 }).notNull(),
  adminId: uuid("admin_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  scores: json("scores").$type<Record<string, number>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userTemplates = pgTable(
  "user_templates",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    bookmarkedAt: timestamp("bookmarked_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.templateId] })]
);

export const dataSourceMeta = pgTable("data_source_meta", {
  id: varchar("id", { length: 50 }).primaryKey(),
  sourceUrl: varchar("source_url", { length: 500 }),
  lastModified: varchar("last_modified", { length: 100 }),
  contentLength: integer("content_length"),
  lastChecked: timestamp("last_checked"),
  lastChanged: timestamp("last_changed"),
  recordCount: integer("record_count"),
});

export const issueTags = pgTable(
  "issue_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    suggestedBy: uuid("suggested_by").references(() => users.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("issue_tags_name_idx").on(table.name),
    index("issue_tags_status_idx").on(table.status),
  ]
);

export const templateIssueTags = pgTable(
  "template_issue_tags",
  {
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    issueTagId: uuid("issue_tag_id")
      .notNull()
      .references(() => issueTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.issueTagId] }),
    index("template_issue_tags_template_id_idx").on(table.templateId),
    index("template_issue_tags_issue_tag_id_idx").on(table.issueTagId),
  ]
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rollCall: integer("roll_call").notNull(),
    chamber: varchar("chamber", { length: 10 }).$type<Chamber>().notNull(),
    congress: integer("congress").notNull(),
    session: integer("session").notNull(),
    date: timestamp("date").notNull(),
    question: text("question").notNull(),
    result: varchar("result", { length: 100 }).notNull(),
    billNumber: varchar("bill_number", { length: 50 }),
    billTitle: text("bill_title"),
    billSubjects: json("bill_subjects").$type<string[]>(),
    sourceUrl: text("source_url").notNull(),
    yeas: integer("yeas").notNull().default(0),
    nays: integer("nays").notNull().default(0),
    notVoting: integer("not_voting").notNull().default(0),
    present: integer("present").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("votes_chamber_congress_session_rollcall_unique").on(
      table.chamber,
      table.congress,
      table.session,
      table.rollCall
    ),
    index("votes_chamber_congress_idx").on(table.chamber, table.congress),
    index("votes_date_idx").on(table.date),
  ]
);

export const memberVotes = pgTable(
  "member_votes",
  {
    voteId: uuid("vote_id")
      .notNull()
      .references(() => votes.id, { onDelete: "cascade" }),
    bioguideId: varchar("bioguide_id", { length: 10 })
      .notNull()
      .references(() => legislators.bioguideId, { onDelete: "cascade" }),
    position: varchar("position", { length: 20 }).$type<VotePosition>().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.voteId, table.bioguideId] }),
    index("member_votes_bioguide_id_idx").on(table.bioguideId),
  ]
);

export const bills = pgTable(
  "bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    billNumber: varchar("bill_number", { length: 50 }).notNull(),
    billType: varchar("bill_type", { length: 10 }).$type<BillType>().notNull(),
    congress: integer("congress").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: varchar("status", { length: 30 }).$type<BillStatus>().notNull(),
    subjects: jsonb("subjects").$type<string[]>().default([]),
    introducedDate: timestamp("introduced_date").notNull(),
    latestActionDate: timestamp("latest_action_date").notNull(),
    latestActionText: text("latest_action_text").notNull(),
    sponsorBioguideId: varchar("sponsor_bioguide_id", { length: 10 }).references(
      () => legislators.bioguideId,
      { onDelete: "set null" }
    ),
    congressGovUrl: text("congress_gov_url").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("bills_congress_type_number_unique").on(
      table.congress,
      table.billType,
      table.billNumber
    ),
    index("bills_sponsor_bioguide_id_idx").on(table.sponsorBioguideId),
    index("bills_congress_latest_action_idx").on(table.congress, table.latestActionDate),
  ]
);

export const syncCursors = pgTable("sync_cursors", {
  id: varchar("id", { length: 50 }).primaryKey(),
  cursor: text("cursor"),
  oldestCongress: integer("oldest_congress"),
  newestCongress: integer("newest_congress"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Legislator = typeof legislators.$inferSelect;
export type NewLegislator = typeof legislators.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type MemberVote = typeof memberVotes.$inferSelect;
export type NewMemberVote = typeof memberVotes.$inferInsert;
export type ZipDistrict = typeof zipDistricts.$inferSelect;
export type NewZipDistrict = typeof zipDistricts.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type EmailOtp = typeof emailOtps.$inferSelect;
export type NewEmailOtp = typeof emailOtps.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateFlag = typeof templateFlags.$inferSelect;
export type NewTemplateFlag = typeof templateFlags.$inferInsert;
export type ModerationLogEntry = typeof moderationLog.$inferSelect;
export type NewModerationLogEntry = typeof moderationLog.$inferInsert;
export type UserTemplate = typeof userTemplates.$inferSelect;
export type NewUserTemplate = typeof userTemplates.$inferInsert;
export type IssueTag = typeof issueTags.$inferSelect;
export type NewIssueTag = typeof issueTags.$inferInsert;
export type TemplateIssueTag = typeof templateIssueTags.$inferSelect;
export type NewTemplateIssueTag = typeof templateIssueTags.$inferInsert;
export type DataSourceMeta = typeof dataSourceMeta.$inferSelect;
export type NewDataSourceMeta = typeof dataSourceMeta.$inferInsert;
export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type SyncCursor = typeof syncCursors.$inferSelect;
export type NewSyncCursor = typeof syncCursors.$inferInsert;
