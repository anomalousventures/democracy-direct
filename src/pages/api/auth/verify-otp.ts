import type { APIRoute } from "astro";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createDb, type Database } from "../../../db/client";
import { emailOtps, users, sessions } from "../../../db/schema";
import { hashEmail } from "../../../lib/auth/hash-email";
import { hashOTP } from "../../../lib/auth/otp";
import { randomUUID } from "crypto";

export const prerender = false;

interface VerifyResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export async function verifyOTPRequest(
  email: string,
  otp: string,
  db: Database
): Promise<VerifyResult> {
  const emailHash = hashEmail(email);
  const otpHash = hashOTP(otp);

  // Find valid OTP record by both email hash and OTP hash
  const otpRecords = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.emailHash, emailHash),
        eq(emailOtps.otpHash, otpHash),
        isNull(emailOtps.usedAt),
        gt(emailOtps.expiresAt, new Date())
      )
    );

  if (otpRecords.length === 0) {
    return { success: false, error: "Invalid or expired OTP" };
  }

  const matchingRecord = otpRecords[0];

  // Mark OTP as used
  await db.update(emailOtps).set({ usedAt: new Date() }).where(eq(emailOtps.id, matchingRecord.id));

  // Get or create user
  const userRecords = await db.select().from(users).where(eq(users.emailHash, emailHash));

  let userId: string;

  if (userRecords.length === 0) {
    const newUsers = await db.insert(users).values({ emailHash }).returning();
    userId = newUsers[0].id;
  } else {
    userId = userRecords[0].id;
  }

  // Create session (30 days)
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return { success: true, sessionId };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || typeof email !== "string" || !otp || typeof otp !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Email and OTP required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = createDb(import.meta.env.DATABASE_URL);
    const result = await verifyOTPRequest(email, otp, db);

    if (!result.success || !result.sessionId) {
      return new Response(JSON.stringify(result), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session cookie
    cookies.set("session", result.sessionId, {
      httpOnly: true,
      secure: !import.meta.env.DEV,
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
