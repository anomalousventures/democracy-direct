import { eq, sql } from "drizzle-orm";
import { users } from "@/db/schema";
import { calculateTrustLevel, TRUST_LEVELS } from "./trust-level";
import type { Database } from "@/db/client";

export async function incrementApprovedTemplatesCount(db: Database, userId: string): Promise<void> {
  const [updated] = await db
    .update(users)
    .set({
      approvedTemplatesCount: sql`${users.approvedTemplatesCount} + 1`,
    })
    .where(eq(users.id, userId))
    .returning({ approvedTemplatesCount: users.approvedTemplatesCount });

  if (!updated) return;

  const newTrustLevel = calculateTrustLevel(
    TRUST_LEVELS.NEW_USER,
    updated.approvedTemplatesCount,
    false
  );

  await db.update(users).set({ trustLevel: newTrustLevel }).where(eq(users.id, userId));
}

export async function handleTemplateRejection(db: Database, userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      trustLevel: TRUST_LEVELS.NEW_USER,
    })
    .where(eq(users.id, userId));
}
