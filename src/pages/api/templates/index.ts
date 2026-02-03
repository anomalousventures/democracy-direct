import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates } from "@/db/schema";
import { validateTemplate, generateSlug, normalizeTags } from "@/lib/template-validation";
import { getConfig } from "@/lib/config";
import {
  jsonResponse,
  badRequest,
  forbidden,
  serverError,
  validationError,
} from "@/lib/api-response";
import { parseJsonBody, templateBodySchema } from "@/lib/request-body";
import { createLogger } from "@/lib/logger";
import { linkTemplateTags } from "@/db/queries/templates";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const logger = createLogger(locals, request);
  const user = locals.user;

  const parseResult = await parseJsonBody(request, templateBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const {
    title,
    description,
    body: templateBody,
    issueTags,
    turnstileToken,
    isPublic,
  } = parseResult.data;

  if (!title || !templateBody) {
    return badRequest("Title and body are required");
  }

  const validationErrors = validateTemplate({ title, description, body: templateBody, issueTags });
  if (validationErrors.length > 0) {
    return validationError(validationErrors);
  }

  const config = getConfig(locals);

  if (!turnstileToken) {
    return forbidden("Turnstile verification required");
  }

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
    return forbidden("Turnstile verification failed");
  }

  try {
    const db = createDb(config.database.url);

    const slug = generateSlug(title);

    const templateIsPublic = user ? (isPublic ?? true) : true;

    const normalizedTags = normalizeTags(issueTags);

    const [newTemplate] = await db
      .insert(templates)
      .values({
        slug,
        title: title.trim(),
        description: description?.trim() ?? null,
        body: templateBody.trim(),
        issueTags: normalizedTags,
        userId: user?.id ?? null,
        isPublic: templateIsPublic,
        moderationStatus: "pending",
        moderationScores: null,
      })
      .returning({
        id: templates.id,
        slug: templates.slug,
        title: templates.title,
        description: templates.description,
        body: templates.body,
        issueTags: templates.issueTags,
        moderationStatus: templates.moderationStatus,
        createdAt: templates.createdAt,
      });

    if (normalizedTags.length > 0) {
      await linkTemplateTags(db, newTemplate.id, normalizedTags);
    }

    return jsonResponse({ template: newTemplate }, 201);
  } catch (error) {
    logger.error("template_create_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: user?.id,
    });
    return serverError("Failed to create template");
  }
};
