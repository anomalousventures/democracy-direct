import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { emailOtps, users, sessions, templates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL!;

export function getTestDb() {
  const sql = neon(DATABASE_URL);
  return drizzle(sql);
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

function hashOTP(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export async function createTestOTP(email: string): Promise<string> {
  const db = getTestDb();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await db.insert(emailOtps).values({
    emailHash: hashEmail(email),
    otpHash: hashOTP(otp),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  return otp;
}

export async function deleteTestUser(email: string): Promise<void> {
  const db = getTestDb();
  const emailHashValue = hashEmail(email);

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.emailHash, emailHashValue))
    .limit(1);

  if (user) {
    await db.delete(sessions).where(eq(sessions.userId, user.id));
    await db.delete(templates).where(eq(templates.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }

  await db.delete(emailOtps).where(eq(emailOtps.emailHash, emailHashValue));
}

export async function getTestUser(email: string) {
  const db = getTestDb();
  const results = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, hashEmail(email)));
  return results[0] ?? null;
}

export async function getTestUserSession(email: string): Promise<string | null> {
  const db = getTestDb();
  const emailHashValue = hashEmail(email);

  const result = await db
    .select({ sessionId: sessions.id })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(users.emailHash, emailHashValue), eq(sessions.expiresAt, sessions.expiresAt)))
    .limit(1);

  return result[0]?.sessionId ?? null;
}

export async function cleanupTestOTPs(email: string): Promise<void> {
  const db = getTestDb();
  await db.delete(emailOtps).where(eq(emailOtps.emailHash, hashEmail(email)));
}

export function getEmailHash(email: string): string {
  return hashEmail(email);
}
