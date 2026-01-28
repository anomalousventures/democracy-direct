import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates, templateFlags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequiredEnv } from "@/lib/env";
import { jsonResponse, badRequest, unauthorized, notFound, serverError } from "@/lib/api-response";
import { parseJsonBody, isFlagBody } from "@/lib/request-body";

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

  const parseResult = await parseJsonBody(request, isFlagBody);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { reason, details } = parseResult.data;

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
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));

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
      return jsonResponse({ error: "You have already flagged this template" }, 429);
    }

    await db.insert(templateFlags).values({
      templateId: template.id,
      userId: user.id,
      reason,
      details: details?.trim() ?? null,
    });

    const newFlagCount = template.flagCount + 1;

    const updateData: { flagCount: number; moderationStatus?: string } = {
      flagCount: newFlagCount,
    };

    if (newFlagCount >= FLAG_HIDE_THRESHOLD) {
      updateData.moderationStatus = "flagged";
    }

    await db.update(templates).set(updateData).where(eq(templates.id, template.id));

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
