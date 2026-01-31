# Address PR Review Comments

## Overview

Fix 2 unresolved review comments on PR #41:

1. **Bug fix**: `getTestUserSession` in db.ts has a tautology that doesn't filter expired sessions
2. **Test improvement**: Private template access control test doesn't actually test the feature

Additionally, update tests to seed their own data rather than skipping when data is missing.

---

## Issue 1: Session Expiry Bug

**File**: `tests/e2e/helpers/db.ts`

**Problem**: Line 71 has `eq(sessions.expiresAt, sessions.expiresAt)` which is always true - doesn't filter expired sessions.

**Fix**: Change to `gt(sessions.expiresAt, new Date())` and add `gt` import from drizzle-orm.

```typescript
// Line 4: Add gt to imports
import { eq, and, gt } from "drizzle-orm";

// Line 71: Fix the where clause
.where(and(eq(users.emailHash, emailHashValue), gt(sessions.expiresAt, new Date())))
```

---

## Issue 2: Private Template Access Control Tests + Seeding

**Problem**:

- The test "non-owner cannot access private template directly" just hits a nonexistent slug
- Tests skip when session data doesn't exist (uses `test.skip()`)

**Solution**:

1. Add Playwright `globalSetup` to seed test data before tests run
2. Remove `test.skip()` calls from auth-templates tests
3. Add a private template to the seed data
4. Update the test to actually verify private template access control

### Step 1: Create Global Setup (`tests/e2e/global-setup.ts`)

```typescript
import { createDb } from "@/db/client";
import { users, sessions, templates } from "@/db/schema";
import { TRUST_LEVELS } from "@/lib/trust-level";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const SESSION_DURATION_DAYS = 30;

export const E2E_ADMIN_EMAIL = "e2e-admin@test.local";
export const E2E_USER_EMAIL = "e2e-user@test.local";
export const E2E_PRIVATE_TEMPLATE_SLUG = "e2e-test-private";

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required for E2E tests");
  }

  const db = createDb(databaseUrl);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // Ensure admin user exists
  const adminEmailHash = hashEmail(E2E_ADMIN_EMAIL);
  let [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, adminEmailHash))
    .limit(1);

  if (!adminUser) {
    [adminUser] = await db
      .insert(users)
      .values({
        emailHash: adminEmailHash,
        trustLevel: TRUST_LEVELS.ADMIN,
      })
      .returning();
  }

  // Ensure admin session exists
  await db.insert(sessions).values({
    userId: adminUser.id,
    expiresAt,
  });

  // Ensure regular user exists
  const userEmailHash = hashEmail(E2E_USER_EMAIL);
  let [regularUser] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, userEmailHash))
    .limit(1);

  if (!regularUser) {
    [regularUser] = await db
      .insert(users)
      .values({
        emailHash: userEmailHash,
        trustLevel: TRUST_LEVELS.NEW_USER,
      })
      .returning();
  }

  // Ensure user session exists
  await db.insert(sessions).values({
    userId: regularUser.id,
    expiresAt,
  });

  // Ensure private template exists (owned by admin)
  const [existingPrivate] = await db
    .select()
    .from(templates)
    .where(eq(templates.slug, E2E_PRIVATE_TEMPLATE_SLUG))
    .limit(1);

  if (!existingPrivate) {
    await db.insert(templates).values({
      slug: E2E_PRIVATE_TEMPLATE_SLUG,
      title: "Private Template for Testing",
      body: "This is a private template that should only be visible to its owner.",
      issueTags: [],
      userId: adminUser.id,
      isPublic: false,
      moderationStatus: "approved",
    });
  }

  console.log("E2E global setup complete");
}

export default globalSetup;
```

### Step 2: Update `playwright.config.ts`

Add the global setup:

```typescript
export default defineConfig({
  globalSetup: "./tests/e2e/global-setup.ts",
  // ... rest of config
});
```

### Step 3: Update `tests/e2e/fixtures/auth.ts`

Update the fixture functions to use the known test user emails and fail loudly instead of returning null:

```typescript
import { E2E_ADMIN_EMAIL, E2E_USER_EMAIL } from "../global-setup";

// Update getAdminSession to query by the known admin email hash
// Update getUserSession to query by the known user email hash
// Remove console.warn fallbacks - if sessions don't exist, the global setup failed
```

### Step 4: Update `tests/e2e/auth-templates.spec.ts`

Remove all `test.skip()` calls and update private template tests:

```typescript
import { E2E_PRIVATE_TEMPLATE_SLUG } from "./global-setup";

test.describe("Private Template Access Control", () => {
  test("owner can access their private template", async ({ adminPage }) => {
    const response = await adminPage.goto(`/templates/${E2E_PRIVATE_TEMPLATE_SLUG}`);
    expect(response?.status()).toBe(200);
  });

  test("non-owner gets 404 for private template", async ({ userPage }) => {
    const response = await userPage.goto(`/templates/${E2E_PRIVATE_TEMPLATE_SLUG}`);
    expect(response?.status()).toBe(404);
  });

  test("anonymous user gets 404 for private template", async ({ page }) => {
    const response = await page.goto(`/templates/${E2E_PRIVATE_TEMPLATE_SLUG}`);
    expect(response?.status()).toBe(404);
  });
});
```

---

## Files to Modify

| File                               | Action                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| `tests/e2e/helpers/db.ts`          | Fix session expiry filter (add `gt`, fix where clause) |
| `tests/e2e/global-setup.ts`        | **Create** - Seeds test users, sessions, and templates |
| `playwright.config.ts`             | Add `globalSetup` option                               |
| `tests/e2e/fixtures/auth.ts`       | Use known test emails, remove null fallbacks           |
| `tests/e2e/auth-templates.spec.ts` | Remove `test.skip()`, add real private template tests  |

---

## Verification

```bash
# TypeScript check
pnpm typecheck

# Run the specific E2E test file
pnpm test:e2e tests/e2e/auth-templates.spec.ts

# Full E2E suite
pnpm test:e2e
```

---

## Reply to PR Comments

After fixes are pushed, reply to both threads confirming the fixes.
