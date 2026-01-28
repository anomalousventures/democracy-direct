import { eq, sql } from "drizzle-orm";
import { users } from "@/db/schema";
import { calculateTrustLevel, TRUST_LEVELS } from "./trust-level";
import type { Database } from "@/db/client";

export async function incrementApprovedTemplatesCount(db: Database, userId: string): Promise<void> {
  const [userRecord] = await db
    .select({ approvedTemplatesCount: users.approvedTemplatesCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRecord) return;

  const newCount = userRecord.approvedTemplatesCount + 1;
  const newTrustLevel = calculateTrustLevel(TRUST_LEVELS.NEW_USER, newCount, false);

  await db
    .update(users)
    .set({
      approvedTemplatesCount: sql`${users.approvedTemplatesCount} + 1`,
      trustLevel: newTrustLevel,
    })
    .where(eq(users.id, userId));
}

export async function handleTemplateRejection(db: Database, userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      trustLevel: TRUST_LEVELS.NEW_USER,
    })
    .where(eq(users.id, userId));
}
