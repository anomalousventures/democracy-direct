import type { APIRoute } from "astro";
import { createDb } from "../../../db/client";
import { emailOtps } from "../../../db/schema";
import { hashEmail } from "../../../lib/auth/hash-email";
import { generateOTP } from "../../../lib/auth/otp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export async function requestOTP(
  email: string,
  db?: ReturnType<typeof createDb>
): Promise<{ success: boolean; error?: string }> {
  if (!validateEmail(email)) {
    return { success: false, error: "Invalid email format" };
  }

  const emailHash = hashEmail(email);
  const { otp, otpHash } = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (db) {
    await db.insert(emailOtps).values({
      emailHash,
      otpHash,
      expiresAt,
    });

    // In production, send email via SES
    // For now, log in development
    if (import.meta.env.DEV) {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }
  }

  // Always return success to prevent email enumeration
  return { success: true };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = createDb(import.meta.env.DATABASE_URL);
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
