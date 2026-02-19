import "dotenv/config";
import { sql } from "drizzle-orm";

export interface CleanupResult {
  otpsDeleted: number;
  sessionsDeleted: number;
  duration: string;
}

export async function cleanupExpired(): Promise<CleanupResult> {
  const startTime = Date.now();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { createDb } = await import("@/db/client");
  const { emailOtps, sessions } = await import("@/db/schema");

  const db = createDb(databaseUrl);

  const otpResult = await db
    .delete(emailOtps)
    .where(sql`${emailOtps.expiresAt} < now() - interval '1 day'`);

  const sessionResult = await db.delete(sessions).where(sql`${sessions.expiresAt} < now()`);

  const otpsDeleted = otpResult.rowCount ?? 0;
  const sessionsDeleted = sessionResult.rowCount ?? 0;
  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

  console.log(`Cleanup complete: ${otpsDeleted} OTPs, ${sessionsDeleted} sessions deleted`);

  return { otpsDeleted, sessionsDeleted, duration };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpired()
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup failed:", error);
      process.exit(1);
    });
}
