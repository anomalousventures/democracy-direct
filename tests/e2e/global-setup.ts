import "dotenv/config";
import { createDb } from "@/db/client";
import { users, sessions, templates } from "@/db/schema";
import { TRUST_LEVELS } from "@/lib/trust-level";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const SESSION_DURATION_DAYS = 30;

export const E2E_ADMIN_EMAIL = "e2e-admin@test.local";
export const E2E_USER_EMAIL = "e2e-user@test.local";
export const E2E_PRIVATE_TEMPLATE_SLUG = "e2e-test-private";

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required for E2E tests");
  }

  const db = createDb(databaseUrl);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const adminEmailHash = hashEmail(E2E_ADMIN_EMAIL);
  let [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, adminEmailHash))
    .limit(1);

  if (!adminUser) {
    [adminUser] = await db
      .insert(users)
      .values({
        emailHash: adminEmailHash,
        trustLevel: TRUST_LEVELS.ADMIN,
      })
      .returning();
    console.log(`Created E2E admin user: ${adminUser.id}`);
  }

  await db.insert(sessions).values({
    userId: adminUser.id,
    expiresAt,
  });

  const userEmailHash = hashEmail(E2E_USER_EMAIL);
  let [regularUser] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, userEmailHash))
    .limit(1);

  if (!regularUser) {
    [regularUser] = await db
      .insert(users)
      .values({
        emailHash: userEmailHash,
        trustLevel: TRUST_LEVELS.NEW_USER,
      })
      .returning();
    console.log(`Created E2E regular user: ${regularUser.id}`);
  }

  await db.insert(sessions).values({
    userId: regularUser.id,
    expiresAt,
  });

  const [existingPrivate] = await db
    .select()
    .from(templates)
    .where(eq(templates.slug, E2E_PRIVATE_TEMPLATE_SLUG))
    .limit(1);

  if (!existingPrivate) {
    await db.insert(templates).values({
      slug: E2E_PRIVATE_TEMPLATE_SLUG,
      title: "Private Template for Testing",
      body: "This is a private template that should only be visible to its owner.",
      issueTags: [],
      userId: adminUser.id,
      isPublic: false,
      moderationStatus: "approved",
    });
    console.log(`Created E2E private template: ${E2E_PRIVATE_TEMPLATE_SLUG}`);
  }

  console.log("E2E global setup complete");
}

export default globalSetup;
