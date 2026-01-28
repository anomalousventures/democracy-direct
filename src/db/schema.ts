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
} from "drizzle-orm/pg-core";

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
    savedZip: varchar("saved_zip", { length: 5 }),
    savedDistrict: varchar("saved_district", { length: 5 }),
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

export const tagSuggestions = pgTable(
  "tag_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull(),
    suggestedBy: uuid("suggested_by").references(() => users.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("tag_suggestions_name_idx").on(table.name),
    index("tag_suggestions_status_idx").on(table.status),
  ]
);

export type Legislator = typeof legislators.$inferSelect;
export type NewLegislator = typeof legislators.$inferInsert;
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
export type TagSuggestion = typeof tagSuggestions.$inferSelect;
export type NewTagSuggestion = typeof tagSuggestions.$inferInsert;
