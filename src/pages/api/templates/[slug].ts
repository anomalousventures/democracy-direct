import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates, type Template } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateTemplate, normalizeTags } from "@/lib/template-validation";
import { getConfig } from "@/lib/config";
import {
  jsonResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  validationError,
} from "@/lib/api-response";
import { parseJsonBody, templateBodySchema } from "@/lib/request-body";
import { createLogger } from "@/lib/logger";
import { syncTemplateTags } from "@/db/queries/templates";

export const prerender = false;

type PublicTemplateFields = Pick<
  Template,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "body"
  | "issueTags"
  | "linkedBillNumbers"
  | "viewCount"
  | "useCount"
  | "forkedFrom"
  | "createdAt"
  | "updatedAt"
>;

function filterPublicFields(template: Template): PublicTemplateFields {
  return {
    id: template.id,
    slug: template.slug,
    title: template.title,
    description: template.description,
    body: template.body,
    issueTags: template.issueTags,
    linkedBillNumbers: template.linkedBillNumbers,
    viewCount: template.viewCount,
    useCount: template.useCount,
    forkedFrom: template.forkedFrom,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

function canViewTemplate(
  template: { isPublic: boolean; moderationStatus: string; userId: string | null },
  userId: string | null
): boolean {
  const isOwner = userId !== null && template.userId === userId;
  if (isOwner) return true;

  return template.isPublic && template.moderationStatus === "approved";
}

export const GET: APIRoute = async ({ params, locals, request }) => {
  const logger = createLogger(locals, request);
  const { slug } = params;

  if (!slug) {
    return badRequest("Slug is required");
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const [template] = await db.select().from(templates).where(eq(templates.slug, slug)).limit(1);

    if (!template) {
      return notFound("Template not found");
    }

    const userId = locals.user?.id ?? null;
    if (!canViewTemplate(template, userId)) {
      return notFound("Template not found");
    }

    const isOwner = userId !== null && template.userId === userId;
    const responseData = isOwner ? template : filterPublicFields(template);

    return jsonResponse({ template: responseData });
  } catch (error) {
    logger.error("template_fetch_failed", {
      slug,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return serverError("Failed to fetch template");
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const logger = createLogger(locals, request);
  const user = locals.user;
  const { slug } = params;

  if (!user) {
    return unauthorized();
  }

  if (!slug) {
    return badRequest("Slug is required");
  }

  const parseResult = await parseJsonBody(request, templateBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const {
    title,
    description,
    body: templateBody,
    issueTags,
    linkedBillNumbers,
    isPublic,
  } = parseResult.data;

  if (!title || !templateBody) {
    return badRequest("Title and body are required");
  }

  const validationErrors = validateTemplate({ title, description, body: templateBody, issueTags });
  if (validationErrors.length > 0) {
    return validationError(validationErrors);
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const [existingTemplate] = await db
      .select({ id: templates.id, userId: templates.userId })
      .from(templates)
      .where(eq(templates.slug, slug))
      .limit(1);

    if (!existingTemplate) {
      return notFound("Template not found");
    }

    if (existingTemplate.userId !== user.id) {
      return forbidden();
    }

    const normalizedTags = normalizeTags(issueTags);

    const [updatedTemplate] = await db
      .update(templates)
      .set({
        title: title.trim(),
        description: description?.trim() ?? null,
        body: templateBody.trim(),
        issueTags: normalizedTags,
        linkedBillNumbers: linkedBillNumbers ?? [],
        isPublic: isPublic ?? true,
        moderationStatus: "pending",
        moderationScores: null,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, existingTemplate.id))
      .returning();

    await syncTemplateTags(db, existingTemplate.id, normalizedTags);

    return jsonResponse({ template: updatedTemplate });
  } catch (error) {
    logger.error("template_update_failed", {
      slug,
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return serverError("Failed to update template");
  }
};

export const DELETE: APIRoute = async ({ params, locals, request }) => {
  const logger = createLogger(locals, request);
  const user = locals.user;
  const { slug } = params;

  if (!user) {
    return unauthorized();
  }

  if (!slug) {
    return badRequest("Slug is required");
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const [existingTemplate] = await db
      .select({ id: templates.id, userId: templates.userId })
      .from(templates)
      .where(eq(templates.slug, slug))
      .limit(1);

    if (!existingTemplate) {
      return notFound("Template not found");
    }

    if (existingTemplate.userId !== user.id) {
      return forbidden();
    }

    await db.delete(templates).where(eq(templates.id, existingTemplate.id));

    return jsonResponse({ success: true });
  } catch (error) {
    logger.error("template_delete_failed", {
      slug,
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return serverError("Failed to delete template");
  }
};
