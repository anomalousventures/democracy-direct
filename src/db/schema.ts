import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  index,
  primaryKey,
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

export type Legislator = typeof legislators.$inferSelect;
export type NewLegislator = typeof legislators.$inferInsert;
export type ZipDistrict = typeof zipDistricts.$inferSelect;
export type NewZipDistrict = typeof zipDistricts.$inferInsert;
