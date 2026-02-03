import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates, moderationLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { jsonResponse, badRequest, notFound, serverError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody } from "@/lib/request-body";
import { z } from "zod";
import { incrementApprovedTemplatesCount, handleTemplateRejection } from "@/lib/user-trust";
import { createLogger } from "@/lib/logger";

export const prerender = false;

const moderationActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().nullable().optional(),
});

const templateIdSchema = z.string().uuid();

export const POST: APIRoute = async ({ params, request, locals }) => {
  const logger = createLogger(locals, request);
  const user = locals.user;
  const adminError = requireAdmin(user);
  if (adminError) return adminError;

  const { templateId } = params;
  if (!templateId) {
    return badRequest("Template ID is required");
  }

  const templateIdResult = templateIdSchema.safeParse(templateId);
  if (!templateIdResult.success) {
    return badRequest("Invalid template ID format");
  }

  const parseResult = await parseJsonBody(request, moderationActionSchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { action, reason } = parseResult.data;

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const [template] = await db
      .select({
        id: templates.id,
        userId: templates.userId,
        moderationStatus: templates.moderationStatus,
        moderationScores: templates.moderationScores,
      })
      .from(templates)
      .where(eq(templates.id, templateId))
      .limit(1);

    if (!template) {
      return notFound("Template not found");
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await db
      .update(templates)
      .set({
        moderationStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId));

    await db.insert(moderationLog).values({
      templateId,
      action: newStatus,
      adminId: user!.id,
      reason: reason ?? null,
      scores: template.moderationScores,
    });

    if (template.userId) {
      if (action === "approve") {
        await incrementApprovedTemplatesCount(db, template.userId);
      } else {
        await handleTemplateRejection(db, template.userId);
      }
    }

    logger.info("admin_moderation_action", {
      templateId,
      action,
      newStatus,
      adminId: user!.id,
    });

    return jsonResponse({
      success: true,
      templateId,
      action,
      newStatus,
    });
  } catch (error) {
    logger.error("admin_moderation_failed", {
      templateId,
      action,
      adminId: user!.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return serverError("Failed to moderate template");
  }
};
