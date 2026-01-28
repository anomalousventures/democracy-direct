import "dotenv/config";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "../db/client";
import { users } from "../db/schema";
import { hashEmail } from "../lib/auth/hash-email";
import { TRUST_LEVELS } from "../lib/trust-level";

const emailSchema = z.string().email();

export function parseAdminEmails(input: string): string[] {
  const emails = input
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const validEmails: string[] = [];
  for (const email of emails) {
    const result = emailSchema.safeParse(email);
    if (result.success) {
      validEmails.push(result.data);
    } else {
      console.warn(`  Skipping invalid email: ${email}`);
    }
  }

  return validEmails;
}

async function ensureAdmins() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const adminUsersEnv = process.env.ADMIN_USERS;
  if (!adminUsersEnv) {
    console.log("ADMIN_USERS not set, skipping admin user setup");
    return;
  }

  const adminEmails = parseAdminEmails(adminUsersEnv);

  if (adminEmails.length === 0) {
    console.log("No valid admin emails configured, skipping");
    return;
  }

  const db = createDb(databaseUrl);

  console.log(`Ensuring ${adminEmails.length} admin user(s)...`);

  for (const email of adminEmails) {
    const emailHash = hashEmail(email);
    const maskedEmail = email.replace(/(.{2}).*@/, "$1***@");

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.emailHash, emailHash))
      .limit(1);

    if (existingUser.length > 0) {
      const user = existingUser[0];
      if (user.trustLevel !== TRUST_LEVELS.ADMIN) {
        await db.update(users).set({ trustLevel: TRUST_LEVELS.ADMIN }).where(eq(users.id, user.id));
        console.log(`  Updated ${maskedEmail} to admin`);
      } else {
        console.log(`  ${maskedEmail} already admin`);
      }
    } else {
      await db.insert(users).values({
        emailHash,
        trustLevel: TRUST_LEVELS.ADMIN,
        approvedTemplatesCount: 0,
      });
      console.log(`  Created admin user: ${maskedEmail}`);
    }
  }

  console.log("Admin users ensured.");
}

ensureAdmins().catch((error) => {
  console.error("Failed to ensure admins:", error);
  process.exit(1);
});
