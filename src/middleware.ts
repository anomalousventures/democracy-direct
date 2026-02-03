import { defineMiddleware } from "astro:middleware";
import { eq, and, gt } from "drizzle-orm";
import { createDb } from "./db/client";
import { sessions, users } from "./db/schema";
import { getConfig } from "./lib/config";
import { createLogger } from "./lib/logger";

export interface SessionUser {
  id: string;
  emailHash: string;
  trustLevel: number;
  savedState: string | null;
  savedDistrict: string | null;
}

export const onRequest = defineMiddleware(async ({ cookies, locals, request }, next) => {
  locals.user = null;

  const sessionId = cookies.get("session")?.value;

  if (sessionId) {
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
      } else {
        locals.user = results[0] as SessionUser;
      }
    } catch (error) {
      const logger = createLogger(locals, request);
      logger.error("session_middleware_error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;

  const url = new URL(request.url);
  const isApi = url.pathname.startsWith("/api/");
  const isAsset = /\.(js|css|ico|png|jpg|svg|woff2?)$/.test(url.pathname);

  if (isApi && !isAsset) {
    const logger = createLogger(locals, request);
    logger.info("api_request", {
      status: response.status,
      duration,
    });
  }

  return response;
});
