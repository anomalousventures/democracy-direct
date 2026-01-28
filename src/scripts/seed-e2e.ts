import "dotenv/config";
import { eq } from "drizzle-orm";
import { createDb } from "../db/client";
import { users, sessions, templates, tagSuggestions } from "../db/schema";
import { TRUST_LEVELS } from "../lib/trust-level";

const SESSION_DURATION_DAYS = 30;

async function seedE2E() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const db = createDb(databaseUrl);

  console.log("Seeding E2E test data...\n");

  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.trustLevel, TRUST_LEVELS.ADMIN))
    .limit(1);

  if (!adminUser) {
    console.error("No admin user found. Run 'pnpm ensure:admins' first with ADMIN_USERS set.");
    process.exit(1);
  }

  console.log(`Using admin user: ${adminUser.id}`);

  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const [session] = await db
    .insert(sessions)
    .values({
      userId: adminUser.id,
      expiresAt,
    })
    .returning({ id: sessions.id });

  console.log(`Created session: ${session.id} (expires: ${expiresAt.toISOString()})`);

  console.log(`\nCreating sample templates...`);

  const sampleTemplates = [
    {
      slug: "e2e-test-infrastructure",
      title: "Support Local Infrastructure Investment",
      body: `Dear {{REP_TITLE}} {{REP_LAST}},

As a constituent in {{STATE}}, I am writing to express my strong support for increased investment in local infrastructure.

Our roads, bridges, and public facilities are the backbone of our community.

Thank you for your service.

Sincerely,
{{USER_NAME}}`,
      issueTags: ["infrastructure", "economy"],
    },
    {
      slug: "e2e-test-climate",
      title: "Urgent Action on Climate Change",
      body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing to express my concern about climate change.

Please support legislation to reduce emissions and invest in clean energy.

Sincerely,
{{USER_NAME}}`,
      issueTags: ["climate", "environment"],
    },
  ];

  for (const template of sampleTemplates) {
    const existing = await db
      .select()
      .from(templates)
      .where(eq(templates.slug, template.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Template "${template.slug}" exists, skipping`);
      continue;
    }

    await db.insert(templates).values({
      slug: template.slug,
      title: template.title,
      body: template.body,
      issueTags: template.issueTags,
      userId: adminUser.id,
      isPublic: true,
      moderationStatus: "approved",
    });

    console.log(`  Created: ${template.slug}`);
  }

  console.log(`\nCreating pending tag suggestion...`);

  const existingTag = await db
    .select()
    .from(tagSuggestions)
    .where(eq(tagSuggestions.name, "e2e-test-tag"))
    .limit(1);

  if (existingTag.length === 0) {
    await db.insert(tagSuggestions).values({
      name: "e2e-test-tag",
      suggestedBy: adminUser.id,
      status: "pending",
    });
    console.log(`  Created: e2e-test-tag`);
  } else {
    console.log(`  Tag "e2e-test-tag" exists, skipping`);
  }

  console.log("\nE2E seed complete!");
}

seedE2E().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
