import type { APIRoute } from "astro";
import { and, eq, gte } from "drizzle-orm";
import { createDb } from "@/db/client";
import { emailOtps } from "@/db/schema";
import { hashEmail } from "@/lib/auth/hash-email";
import { generateOTP } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email";
import { createOtpEmail } from "@/lib/email/templates/otp";
import { getRequiredEnv } from "@/lib/env";

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export async function requestOTP(
  email: string,
  db?: ReturnType<typeof createDb>,
  emailSender: typeof sendEmail = sendEmail
): Promise<{ success: boolean; error?: string }> {
  if (!validateEmail(email)) {
    return { success: false, error: "Invalid email format" };
  }

  const emailHash = hashEmail(email);

  if (db) {
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const recentRequests = await db
      .select({ id: emailOtps.id })
      .from(emailOtps)
      .where(and(eq(emailOtps.emailHash, emailHash), gte(emailOtps.createdAt, oneHourAgo)));

    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    const { otp, otpHash } = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(emailOtps).values({
      emailHash,
      otpHash,
      expiresAt,
    });

    const emailMessage = createOtpEmail({
      to: email,
      otp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    try {
      await emailSender(emailMessage);
    } catch (error) {
      console.error("Failed to send OTP email:", error);
    }
  }

  // Always return success to prevent email enumeration
  return { success: true };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));
    const result = await requestOTP(email, db);

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OTP request error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
