import { test as base, type Page } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

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
    const sql = neon(databaseUrl);

    const result = await sql`
      SELECT s.id
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE u.trust_level = 2
        AND s.expires_at > NOW()
      ORDER BY s.created_at DESC
      LIMIT 1
    `;

    if (result.length > 0) {
      return result[0].id as string;
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
