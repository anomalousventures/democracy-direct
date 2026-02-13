import { defineMiddleware } from "astro:middleware";
import { eq, and, gt } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { createDb } from "./db/client";
import { sessions } from "./db/schema";
import { getConfig } from "./lib/config";
import { createLogger } from "./lib/logger";

export interface SessionUser {
  id: string;
  emailHash: string;
  trustLevel: number;
  savedState: string | null;
  savedDistrict: string | null;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(uuid: string, key: CryptoKey): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(uuid));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(uuid: string, signature: string, key: CryptoKey): Promise<boolean> {
  const sigBytes = new Uint8Array(signature.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(uuid));
}

export const onRequest = defineMiddleware(async ({ cookies, locals, request }, next) => {
  locals.user = null;

  const cookieSecret =
    locals.runtime?.env?.VISITOR_COOKIE_SECRET ?? import.meta.env.VISITOR_COOKIE_SECRET;

  if (cookieSecret) {
    const hmacKey = await getHmacKey(cookieSecret);
    const existing = cookies.get("visitor_id")?.value;
    let visitorId: string | null = null;

    if (existing) {
      const dotIndex = existing.lastIndexOf(".");
      if (dotIndex > 0) {
        const uuid = existing.slice(0, dotIndex);
        const sig = existing.slice(dotIndex + 1);
        if (await hmacVerify(uuid, sig, hmacKey)) {
          visitorId = uuid;
        }
      }
    }

    if (!visitorId) {
      visitorId = uuidv7();
      const sig = await hmacSign(visitorId, hmacKey);
      cookies.set("visitor_id", `${visitorId}.${sig}`, {
        path: "/",
        httpOnly: true,
        secure: !import.meta.env.DEV,
        sameSite: "strict",
      });
    }

    locals.visitorId = visitorId;
  } else {
    locals.visitorId = uuidv7();
  }

  const sessionId = cookies.get("session")?.value;

  if (sessionId) {
    try {
      const config = getConfig(locals);
      const db = createDb(config.database.url);

      const result = await db.query.sessions.findFirst({
        where: and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())),
        with: { user: true },
      });

      if (!result) {
        cookies.delete("session", { path: "/" });
      } else {
        locals.user = {
          id: result.user.id,
          emailHash: result.user.emailHash,
          trustLevel: result.user.trustLevel,
          savedState: result.user.savedState,
          savedDistrict: result.user.savedDistrict,
        };
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
