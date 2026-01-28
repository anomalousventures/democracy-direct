import { defineMiddleware } from "astro:middleware";
import { eq, and, gt } from "drizzle-orm";
import { createDb } from "./db/client";
import { sessions, users } from "./db/schema";
import { getConfig } from "./lib/config";

export interface SessionUser {
  id: string;
  emailHash: string;
  trustLevel: number;
}

export const onRequest = defineMiddleware(async ({ cookies, locals }, next) => {
  const sessionId = cookies.get("session")?.value;

  if (!sessionId) {
    locals.user = null;
    return next();
  }

  // Get config outside try/catch so config errors surface immediately
  const config = getConfig(locals);
  const db = createDb(config.database.url);

  try {
    const results = await db
      .select({
        id: users.id,
        emailHash: users.emailHash,
        trustLevel: users.trustLevel,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));

    if (results.length === 0) {
      cookies.delete("session", { path: "/" });
      locals.user = null;
      return next();
    }

    locals.user = results[0] as SessionUser;
  } catch (error) {
    console.error("Session middleware error:", error);
    locals.user = null;
  }

  return next();
});
