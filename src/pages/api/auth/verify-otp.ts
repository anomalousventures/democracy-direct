import type { APIRoute } from "astro";
import { eq, and, isNull, gt, lt, sql } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { emailOtps, users, sessions } from "@/db/schema";
import { badRequest, unauthorized, serverError, jsonResponse } from "@/lib/api-response";
import { hashEmail } from "@/lib/auth/hash-email";
import { hashOTP } from "@/lib/auth/otp";
import { getConfig } from "@/lib/config";
import { parseJsonBody, verifyOtpBodySchema } from "@/lib/request-body";

export const prerender = false;

const MAX_VERIFICATION_ATTEMPTS = 5;

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

  const validOtps = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.emailHash, emailHash),
        isNull(emailOtps.usedAt),
        gt(emailOtps.expiresAt, new Date()),
        lt(emailOtps.verificationAttempts, MAX_VERIFICATION_ATTEMPTS)
      )
    );

  if (validOtps.length === 0) {
    return { success: false, error: "Invalid or expired OTP" };
  }

  const matchingOtp = validOtps.find((record) => record.otpHash === otpHash);

  if (!matchingOtp) {
    const mostRecentOtp = validOtps[0];
    await db
      .update(emailOtps)
      .set({ verificationAttempts: sql`${emailOtps.verificationAttempts} + 1` })
      .where(eq(emailOtps.id, mostRecentOtp.id));

    return { success: false, error: "Invalid or expired OTP" };
  }

  await db.update(emailOtps).set({ usedAt: new Date() }).where(eq(emailOtps.id, matchingOtp.id));

  const userRecords = await db.select().from(users).where(eq(users.emailHash, emailHash));

  let userId: string;

  if (userRecords.length === 0) {
    const newUsers = await db.insert(users).values({ emailHash }).returning();
    userId = newUsers[0].id;
  } else {
    userId = userRecords[0].id;
  }

  const sessionId = crypto.randomUUID();
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
    const config = getConfig(locals);
    const db = createDb(config.database.url);
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
