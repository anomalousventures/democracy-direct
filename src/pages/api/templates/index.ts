import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateTemplate, generateSlug } from "@/lib/template-validation";
import { getConfig } from "@/lib/config";
import {
  jsonResponse,
  badRequest,
  forbidden,
  serverError,
  validationError,
} from "@/lib/api-response";
import { parseJsonBody, templateBodySchema } from "@/lib/request-body";
import { moderateTemplate } from "@/lib/moderation/moderate-template";
import { incrementApprovedTemplatesCount } from "@/lib/user-trust";
import { TRUST_LEVELS } from "@/lib/trust-level";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  const parseResult = await parseJsonBody(request, templateBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { title, body: templateBody, issueTags, turnstileToken, isPublic } = parseResult.data;

  if (!title || !templateBody) {
    return badRequest("Title and body are required");
  }

  const validationErrors = validateTemplate({ title, body: templateBody, issueTags });
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

    let trustLevel: number = TRUST_LEVELS.NEW_USER;
    if (user) {
      const [userRecord] = await db
        .select({ trustLevel: users.trustLevel })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      trustLevel = userRecord?.trustLevel ?? TRUST_LEVELS.NEW_USER;
    }

    const openaiKey = config.moderation.openaiApiKey;
    const contentToModerate = `${title}\n\n${templateBody}`;
    const moderation = await moderateTemplate(contentToModerate, openaiKey, trustLevel);

    const slug = generateSlug(title);

    const templateIsPublic = user ? (isPublic ?? true) : true;

    const [newTemplate] = await db
      .insert(templates)
      .values({
        slug,
        title: title.trim(),
        body: templateBody.trim(),
        issueTags: issueTags?.filter((t: string) => t.trim()) ?? [],
        userId: user?.id ?? null,
        isPublic: templateIsPublic,
        moderationStatus: moderation.status,
        moderationScores: moderation.scores,
      })
      .returning({
        id: templates.id,
        slug: templates.slug,
        title: templates.title,
        body: templates.body,
        issueTags: templates.issueTags,
        moderationStatus: templates.moderationStatus,
        createdAt: templates.createdAt,
      });

    if (moderation.status === "approved" && user) {
      await incrementApprovedTemplatesCount(db, user.id);
    }

    return jsonResponse({ template: newTemplate }, 201);
  } catch (error) {
    console.error("Failed to create template:", error);
    return serverError("Failed to create template");
  }
};
