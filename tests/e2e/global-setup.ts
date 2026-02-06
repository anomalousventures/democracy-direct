import "dotenv/config";
import { createDb } from "@/db/client";
import {
  users,
  sessions,
  templates,
  bills,
  votes,
  memberVotes,
  amendments,
  legislators,
  type NewBill,
  type NewVote,
  type NewAmendment,
} from "@/db/schema";
import { TRUST_LEVELS } from "@/lib/trust-level";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

const SESSION_DURATION_DAYS = 30;

export const E2E_ADMIN_EMAIL = "e2e-admin@test.local";
export const E2E_USER_EMAIL = "e2e-user@test.local";
export const E2E_PRIVATE_TEMPLATE_SLUG = "e2e-test-private";

export const E2E_BILL: Pick<
  NewBill,
  | "billNumber"
  | "billType"
  | "congress"
  | "title"
  | "summary"
  | "status"
  | "subjects"
  | "congressGovUrl"
> = {
  billNumber: "9999",
  billType: "hr",
  congress: 119,
  title: "E2E Test Civic Engagement Act",
  summary: "A bill to test the legislation search UI end-to-end.",
  status: "introduced",
  subjects: ["Education", "Testing"],
  congressGovUrl: "https://www.congress.gov/bill/119th-congress/house-bill/9999",
};

export const E2E_VOTE: Pick<
  NewVote,
  | "rollCall"
  | "chamber"
  | "congress"
  | "session"
  | "question"
  | "result"
  | "billNumber"
  | "billTitle"
  | "sourceUrl"
  | "yeas"
  | "nays"
  | "notVoting"
  | "present"
> = {
  rollCall: 9999,
  chamber: "house",
  congress: 119,
  session: 1,
  question: "On Passage - E2E Test Civic Engagement Act",
  result: "Passed",
  billNumber: "H.R.9999",
  billTitle: "E2E Test Civic Engagement Act",
  sourceUrl: "https://clerk.house.gov/Votes/2025999",
  yeas: 250,
  nays: 180,
  notVoting: 3,
  present: 2,
};

export const E2E_AMENDMENT: Pick<
  NewAmendment,
  | "amendmentNumber"
  | "amendmentType"
  | "congress"
  | "chamber"
  | "description"
  | "purpose"
  | "congressGovUrl"
> = {
  amendmentNumber: "9999",
  amendmentType: "hamdt",
  congress: 119,
  chamber: "house",
  description: "An amendment to test amendment detail pages end-to-end.",
  purpose: "E2E testing purposes",
  congressGovUrl: "https://www.congress.gov/amendment/119th-congress/house-amendment/9999",
};

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
    console.log(`Created E2E admin user: ${adminUser.id}`);
  }

  await db.insert(sessions).values({
    userId: adminUser.id,
    expiresAt,
  });

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
    console.log(`Created E2E regular user: ${regularUser.id}`);
  }

  await db.insert(sessions).values({
    userId: regularUser.id,
    expiresAt,
  });

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
    console.log(`Created E2E private template: ${E2E_PRIVATE_TEMPLATE_SLUG}`);
  }

  // Seed legislation data for e2e tests
  // Use a known legislator as sponsor (first one found)
  const [sponsor] = await db
    .select({ bioguideId: legislators.bioguideId })
    .from(legislators)
    .limit(1);

  if (sponsor) {
    // Seed bill
    const [existingBill] = await db
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.congress, E2E_BILL.congress),
          eq(bills.billType, E2E_BILL.billType),
          eq(bills.billNumber, E2E_BILL.billNumber)
        )
      )
      .limit(1);

    let billId: string;
    if (existingBill) {
      billId = existingBill.id;
    } else {
      const [newBill] = await db
        .insert(bills)
        .values({
          ...E2E_BILL,
          introducedDate: new Date("2025-01-15"),
          latestActionDate: new Date("2025-03-01"),
          latestActionText: "Referred to the Committee on Education.",
          sponsorBioguideId: sponsor.bioguideId,
        })
        .returning();
      billId = newBill.id;
      console.log(`Created E2E bill: ${billId}`);
    }

    // Seed amendment linked to the bill
    const [existingAmendment] = await db
      .select()
      .from(amendments)
      .where(
        and(
          eq(amendments.congress, E2E_AMENDMENT.congress),
          eq(amendments.amendmentType, E2E_AMENDMENT.amendmentType),
          eq(amendments.amendmentNumber, E2E_AMENDMENT.amendmentNumber)
        )
      )
      .limit(1);

    if (!existingAmendment) {
      await db.insert(amendments).values({
        ...E2E_AMENDMENT,
        latestActionDate: new Date("2025-02-15"),
        latestActionText: "Amendment agreed to by voice vote.",
        sponsorBioguideId: sponsor.bioguideId,
        amendedBillId: billId,
      });
      console.log("Created E2E amendment");
    }

    // Seed vote linked to the bill
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.chamber, E2E_VOTE.chamber),
          eq(votes.congress, E2E_VOTE.congress),
          eq(votes.session, E2E_VOTE.session),
          eq(votes.rollCall, E2E_VOTE.rollCall)
        )
      )
      .limit(1);

    if (!existingVote) {
      const [newVote] = await db
        .insert(votes)
        .values({
          ...E2E_VOTE,
          date: new Date("2025-03-01"),
          billId,
        })
        .returning();

      // Seed a couple member votes using the sponsor
      await db.insert(memberVotes).values({
        voteId: newVote.id,
        bioguideId: sponsor.bioguideId,
        position: "yea",
      });
      console.log(`Created E2E vote: ${newVote.id}`);
    }
  }

  console.log("E2E global setup complete");
}

export default globalSetup;
