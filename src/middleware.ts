import { defineMiddleware } from "astro:middleware";
import { eq } from "drizzle-orm";
import { createDb, type Database } from "./db/client";
import { sessions, users } from "./db/schema";

export interface SessionUser {
  id: string;
  emailHash: string;
  trustLevel: number;
}

let cachedDb: Database | null = null;

function getDb(): Database {
  if (!cachedDb) {
    cachedDb = createDb(import.meta.env.DATABASE_URL);
  }
  return cachedDb;
}

export const onRequest = defineMiddleware(async ({ cookies, locals }, next) => {
  const sessionId = cookies.get("session")?.value;

  if (!sessionId) {
    locals.user = null;
    return next();
  }

  try {
    const db = getDb();

    const sessionRecords = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (sessionRecords.length === 0 || sessionRecords[0].expiresAt < new Date()) {
      // Invalid or expired session
      cookies.delete("session", { path: "/" });
      locals.user = null;
      return next();
    }

    const userRecords = await db
      .select({
        id: users.id,
        emailHash: users.emailHash,
        trustLevel: users.trustLevel,
      })
      .from(users)
      .where(eq(users.id, sessionRecords[0].userId));

    if (userRecords.length === 0) {
      cookies.delete("session", { path: "/" });
      locals.user = null;
      return next();
    }

    locals.user = userRecords[0] as SessionUser;
  } catch (error) {
    console.error("Session middleware error:", error);
    locals.user = null;
  }

  return next();
});
