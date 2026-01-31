import { defineMiddleware } from "astro:middleware";
import { eq, and, gt } from "drizzle-orm";
import { createDb } from "./db/client";
import { sessions, users } from "./db/schema";
import { getConfig } from "./lib/config";

export interface SessionUser {
  id: string;
  emailHash: string;
  trustLevel: number;
  savedState: string | null;
  savedDistrict: string | null;
}

export const onRequest = defineMiddleware(async ({ cookies, locals }, next) => {
  // Initialize user as null first
  locals.user = null;

  const sessionId = cookies.get("session")?.value;

  if (!sessionId) {
    return next();
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const results = await db
      .select({
        id: users.id,
        emailHash: users.emailHash,
        trustLevel: users.trustLevel,
        savedState: users.savedState,
        savedDistrict: users.savedDistrict,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));

    if (results.length === 0) {
      cookies.delete("session", { path: "/" });
      return next();
    }

    locals.user = results[0] as SessionUser;
  } catch (error) {
    console.error("Session middleware error:", error);
    // User remains null on error
  }

  return next();
});
