import type { APIRoute } from "astro";
import { randomUUID } from "crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { emailOtps, users, sessions } from "@/db/schema";
import { badRequest, unauthorized, serverError, jsonResponse } from "@/lib/api-response";
import { hashEmail } from "@/lib/auth/hash-email";
import { hashOTP } from "@/lib/auth/otp";
import { getRequiredEnv } from "@/lib/env";
import { parseJsonBody, verifyOtpBodySchema } from "@/lib/request-body";

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

  await db.update(emailOtps).set({ usedAt: new Date() }).where(eq(emailOtps.id, matchingRecord.id));

  const userRecords = await db.select().from(users).where(eq(users.emailHash, emailHash));

  let userId: string;

  if (userRecords.length === 0) {
    const newUsers = await db.insert(users).values({ emailHash }).returning();
    userId = newUsers[0].id;
  } else {
    userId = userRecords[0].id;
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return { success: true, sessionId };
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const parseResult = await parseJsonBody(request, verifyOtpBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { email, otp } = parseResult.data;

  try {
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));
    const result = await verifyOTPRequest(email, otp, db);

    if (!result.success || !result.sessionId) {
      return unauthorized(result.error ?? "Invalid or expired OTP");
    }

    cookies.set("session", result.sessionId, {
      httpOnly: true,
      secure: !import.meta.env.DEV,
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("OTP verification error:", error);
    return serverError("Internal error");
  }
};
