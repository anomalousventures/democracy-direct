import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { jsonResponse, badRequest, notFound, serverError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin";
import { moderateContent } from "@/lib/moderation/openai";
import { makeModerationDecision, scoresToRecord } from "@/lib/moderation/decision";
import { z } from "zod";

export const prerender = false;

const templateIdSchema = z.string().uuid();

const DECISION_TO_STATUS = {
  approve: "approved",
  review: "pending",
  reject: "rejected",
} as const;

export const POST: APIRoute = async ({ params, locals }) => {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const { templateId } = params;
  if (!templateId) {
    return badRequest("Template ID is required");
  }

  const templateIdResult = templateIdSchema.safeParse(templateId);
  if (!templateIdResult.success) {
    return badRequest("Invalid template ID format");
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const [template] = await db
      .select({
        id: templates.id,
        title: templates.title,
        body: templates.body,
        moderationStatus: templates.moderationStatus,
      })
      .from(templates)
      .where(eq(templates.id, templateId))
      .limit(1);

    if (!template) {
      return notFound("Template not found");
    }

    const openaiKey = config.moderation.openaiApiKey;
    if (!openaiKey) {
      return serverError("OpenAI API key not configured");
    }

    const content = `${template.title}\n\n${template.body}`;
    const result = await moderateContent(content, openaiKey);
    const decision = makeModerationDecision(result, undefined, 0);

    const newStatus = DECISION_TO_STATUS[decision.decision];

    await db
      .update(templates)
      .set({
        moderationScores: scoresToRecord(result.categoryScores),
        moderationStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId));

    return jsonResponse({
      success: true,
      templateId,
      previousStatus: template.moderationStatus,
      newStatus,
      decision: decision.decision,
      scores: scoresToRecord(result.categoryScores),
      flagged: result.flagged,
    });
  } catch (error) {
    console.error("Failed to request moderation:", error);
    return serverError("Failed to request moderation");
  }
};
