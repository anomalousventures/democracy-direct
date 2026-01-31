import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates, templateFlags } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import {
  jsonResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  conflict,
} from "@/lib/api-response";
import { parseJsonBody, flagBodySchema } from "@/lib/request-body";

export const prerender = false;

const FLAG_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "misinformation",
  "inappropriate",
  "other",
] as const;

type FlagReason = (typeof FLAG_REASONS)[number];

const FLAG_HIDE_THRESHOLD = 3;
const MAX_FLAGS_PER_USER_PER_TEMPLATE = 1;

export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  const { slug } = params;

  if (!user) {
    return unauthorized();
  }

  if (!slug) {
    return badRequest("Template slug is required");
  }

  const parseResult = await parseJsonBody(request, flagBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { reason, details, turnstileToken } = parseResult.data;

  if (!reason || !FLAG_REASONS.includes(reason as FlagReason)) {
    return jsonResponse(
      {
        error: "Invalid flag reason",
        validReasons: [...FLAG_REASONS],
      },
      400
    );
  }

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

    const [template] = await db
      .select({ id: templates.id, flagCount: templates.flagCount })
      .from(templates)
      .where(eq(templates.slug, slug))
      .limit(1);

    if (!template) {
      return notFound("Template not found");
    }

    const existingFlags = await db
      .select({ id: templateFlags.id })
      .from(templateFlags)
      .where(and(eq(templateFlags.templateId, template.id), eq(templateFlags.userId, user.id)));

    if (existingFlags.length >= MAX_FLAGS_PER_USER_PER_TEMPLATE) {
      return conflict("You have already flagged this template");
    }

    await db.insert(templateFlags).values({
      templateId: template.id,
      userId: user.id,
      reason,
      details: details?.trim() ?? null,
    });

    const [updated] = await db
      .update(templates)
      .set({
        flagCount: sql`${templates.flagCount} + 1`,
      })
      .where(eq(templates.id, template.id))
      .returning({ flagCount: templates.flagCount });

    const newFlagCount = updated?.flagCount ?? template.flagCount + 1;

    if (newFlagCount >= FLAG_HIDE_THRESHOLD) {
      await db
        .update(templates)
        .set({ moderationStatus: "flagged" })
        .where(eq(templates.id, template.id));
    }

    return jsonResponse({
      success: true,
      message:
        newFlagCount >= FLAG_HIDE_THRESHOLD
          ? "Template flagged and hidden for review"
          : "Template flagged successfully",
    });
  } catch (error) {
    console.error("Failed to flag template:", error);
    return serverError("Failed to flag template");
  }
};
