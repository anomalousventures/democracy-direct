import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateTemplate, generateSlug } from "@/lib/template-validation";
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

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return unauthorized();
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
    forkedFromId,
    turnstileToken,
    isPublic,
  } = parseResult.data;

  if (!title || !templateBody) {
    return badRequest("Title and body are required");
  }

  if (!forkedFromId) {
    return badRequest("Source template ID is required");
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

    const [sourceTemplate] = await db
      .select({ id: templates.id })
      .from(templates)
      .where(
        and(
          eq(templates.id, forkedFromId),
          eq(templates.isPublic, true),
          eq(templates.moderationStatus, "approved")
        )
      )
      .limit(1);

    if (!sourceTemplate) {
      return notFound("Source template not found");
    }

    const slug = generateSlug(title);

    const templateIsPublic = isPublic ?? true;

    const [newTemplate] = await db
      .insert(templates)
      .values({
        slug,
        title: title.trim(),
        description: description?.trim() ?? null,
        body: templateBody.trim(),
        issueTags: issueTags?.filter((t: string) => t.trim()) ?? [],
        userId: user.id,
        isPublic: templateIsPublic,
        forkedFrom: forkedFromId,
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
        forkedFrom: templates.forkedFrom,
        moderationStatus: templates.moderationStatus,
        createdAt: templates.createdAt,
      });

    return jsonResponse({ template: newTemplate }, 201);
  } catch (error) {
    console.error("Failed to fork template:", error);
    return serverError("Failed to fork template");
  }
};
