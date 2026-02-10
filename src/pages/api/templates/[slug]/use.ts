import type { APIRoute } from "astro";
import { eq, and, sql } from "drizzle-orm";
import { createDb } from "@/db/client";
import { templates, templateUses } from "@/db/schema";
import { getConfig } from "@/lib/config";
import { badRequest, notFound, jsonResponse, serverError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/request-body";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { BIOGUIDE_RE } from "@/lib/bioguide";

export const prerender = false;
const CONTACT_TYPES = ["call", "contact_form", "print", "copy"] as const;

const useBodySchema = z.object({
  repBioguideId: z.string().regex(BIOGUIDE_RE, "Invalid bioguide ID"),
  contactType: z.enum(CONTACT_TYPES),
});

export const POST: APIRoute = async ({ params, locals, request }) => {
  const logger = createLogger(locals, request);
  const { slug } = params;

  if (!slug) {
    return badRequest("Template slug is required");
  }

  const visitorId = locals.visitorId;
  if (!visitorId) {
    return badRequest("Missing visitor ID");
  }

  const parseResult = await parseJsonBody(request, useBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { repBioguideId, contactType } = parseResult.data;

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const template = await db.query.templates.findFirst({
      where: and(
        eq(templates.slug, slug),
        eq(templates.isPublic, true),
        eq(templates.moderationStatus, "approved")
      ),
      columns: { id: true },
    });

    if (!template) {
      return notFound("Template not found");
    }

    const result = await db
      .insert(templateUses)
      .values({
        templateId: template.id,
        repBioguideId,
        contactType,
        visitorId,
      })
      .onConflictDoNothing({
        target: [
          templateUses.templateId,
          templateUses.repBioguideId,
          templateUses.contactType,
          templateUses.visitorId,
        ],
      });

    if (result.rowCount && result.rowCount > 0) {
      await db
        .update(templates)
        .set({ useCount: sql`${templates.useCount} + 1` })
        .where(eq(templates.id, template.id));
    }

    return jsonResponse({ recorded: (result.rowCount ?? 0) > 0 });
  } catch (error) {
    logger.error("template_use_failed", {
      slug,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return serverError("Failed to record template use");
  }
};
