import type { APIRoute } from "astro";
import { and, eq, gte } from "drizzle-orm";
import { createDb } from "@/db/client";
import { emailOtps } from "@/db/schema";
import { badRequest, forbidden, jsonResponse } from "@/lib/api-response";
import { hashEmail } from "@/lib/auth/hash-email";
import { generateOTP } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email";
import { createOtpEmail } from "@/lib/email/templates/otp";
import { getConfig } from "@/lib/config";
import { parseJsonBody, requestOtpBodySchema } from "@/lib/request-body";
import { createLogger, type Logger } from "@/lib/logger";

export const prerender = false;

const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_HOURS = 1;

type EmailSender = (
  message: Parameters<typeof sendEmail>[0],
  locals: App.Locals,
  logger?: Logger
) => Promise<boolean>;

export async function requestOTP(
  email: string,
  locals: App.Locals,
  db?: ReturnType<typeof createDb>,
  emailSender: EmailSender = sendEmail,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> {
  const emailHash = hashEmail(email);

  if (db) {
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const recentRequests = await db
      .select({ id: emailOtps.id })
      .from(emailOtps)
      .where(and(eq(emailOtps.emailHash, emailHash), gte(emailOtps.createdAt, oneHourAgo)));

    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
      return { success: true };
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

    const sent = await emailSender(emailMessage, locals, logger);
    if (!sent) {
      logger?.error("otp_email_failed", { emailHashPrefix: emailHash.slice(0, 8) });
      return { success: false, error: "Failed to send verification email. Please try again." };
    }
  }

  return { success: true };
}

export const POST: APIRoute = async ({ request, locals }) => {
  const logger = createLogger(locals, request);
  const parseResult = await parseJsonBody(request, requestOtpBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { email, turnstileToken } = parseResult.data;

  try {
    const config = getConfig(locals);

    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: config.turnstile.secretKey,
          response: turnstileToken,
        }),
      }
    );

    const turnstileResult: unknown = await turnstileResponse.json();
    const isValidTurnstile =
      typeof turnstileResult === "object" &&
      turnstileResult !== null &&
      "success" in turnstileResult &&
      turnstileResult.success === true;

    if (!isValidTurnstile) {
      return forbidden("Verification failed");
    }

    const db = createDb(config.database.url);
    const result = await requestOTP(email, locals, db, sendEmail, logger);

    if (!result.success) {
      return jsonResponse({ success: false, error: result.error }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    logger.error("otp_request_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return jsonResponse({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
};
