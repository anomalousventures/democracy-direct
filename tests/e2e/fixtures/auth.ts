import { test as base, type Page } from "@playwright/test";
import { and, desc, eq, gt } from "drizzle-orm";
import { createDb } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { TRUST_LEVELS } from "@/lib/trust-level";

interface AuthFixtures {
  adminPage: Page;
  adminSessionId: string;
}

async function getAdminSession(): Promise<string | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set, skipping admin session setup");
    return null;
  }

  try {
    const db = createDb(databaseUrl);

    const result = await db
      .select({ id: sessions.id })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(users.trustLevel, TRUST_LEVELS.ADMIN), gt(sessions.expiresAt, new Date())))
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    if (result.length > 0) {
      return result[0].id;
    }

    console.warn("No valid admin session found. Run 'pnpm seed:e2e' first.");
    return null;
  } catch (error) {
    console.warn("Failed to get admin session:", error);
    return null;
  }
}

export const test = base.extend<AuthFixtures>({
  // eslint-disable-next-line no-empty-pattern
  adminSessionId: async ({}, use) => {
    const sessionId = await getAdminSession();
    await use(sessionId ?? "");
  },

  adminPage: async ({ page, adminSessionId }, use) => {
    if (adminSessionId) {
      await page.context().addCookies([
        {
          name: "session",
          value: adminSessionId,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "Strict",
        },
      ]);
    }
    await use(page);
  },
});

export { expect } from "@playwright/test";
