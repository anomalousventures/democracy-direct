import { test as base, type Page } from "@playwright/test";
import { and, desc, eq, gt } from "drizzle-orm";
import { createDb } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { createHash } from "crypto";
import { E2E_ADMIN_EMAIL, E2E_USER_EMAIL } from "../global-setup";

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

interface AuthFixtures {
  adminPage: Page;
  adminSessionId: string;
  userPage: Page;
  userSessionId: string;
}

async function getAdminSession(): Promise<string> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required for E2E tests");
  }

  const db = createDb(databaseUrl);
  const emailHash = hashEmail(E2E_ADMIN_EMAIL);

  const result = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(users.emailHash, emailHash), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt))
    .limit(1);

  if (result.length === 0) {
    throw new Error("No valid admin session found. Global setup may have failed.");
  }

  return result[0].id;
}

async function getUserSession(): Promise<string> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required for E2E tests");
  }

  const db = createDb(databaseUrl);
  const emailHash = hashEmail(E2E_USER_EMAIL);

  const result = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(users.emailHash, emailHash), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt))
    .limit(1);

  if (result.length === 0) {
    throw new Error("No valid user session found. Global setup may have failed.");
  }

  return result[0].id;
}

export const test = base.extend<AuthFixtures>({
  // eslint-disable-next-line no-empty-pattern
  adminSessionId: async ({}, use) => {
    const sessionId = await getAdminSession();
    await use(sessionId);
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

  // eslint-disable-next-line no-empty-pattern
  userSessionId: async ({}, use) => {
    const sessionId = await getUserSession();
    await use(sessionId);
  },

  userPage: async ({ browser, userSessionId }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    if (userSessionId) {
      await context.addCookies([
        {
          name: "session",
          value: userSessionId,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "Strict",
        },
      ]);
    }
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
