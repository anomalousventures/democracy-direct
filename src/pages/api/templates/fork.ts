import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates } from "@/db/schema";
import { validateTemplate, generateSlug } from "@/lib/template-validation";
import { getRequiredEnv } from "@/lib/env";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    title,
    body: templateBody,
    issueTags,
    forkedFromId,
    turnstileToken,
  } = body as {
    title?: string;
    body?: string;
    issueTags?: string[];
    forkedFromId?: string;
    turnstileToken?: string;
  };

  if (!title || !templateBody) {
    return new Response(JSON.stringify({ error: "Title and body are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!forkedFromId) {
    return new Response(JSON.stringify({ error: "Source template ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationErrors = validateTemplate({ title, body: templateBody, issueTags });
  if (validationErrors.length > 0) {
    return new Response(JSON.stringify({ error: "Validation failed", errors: validationErrors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const turnstileSecret = getRequiredEnv(locals, "TURNSTILE_SECRET_KEY");
  if (turnstileSecret && turnstileSecret !== "test-secret") {
    if (!turnstileToken) {
      return new Response(JSON.stringify({ error: "Turnstile verification required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      }
    );

    const turnstileResult = (await turnstileResponse.json()) as { success: boolean };
    if (!turnstileResult.success) {
      return new Response(JSON.stringify({ error: "Turnstile verification failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));

    const slug = generateSlug(title);

    const [newTemplate] = await db
      .insert(templates)
      .values({
        slug,
        title: title.trim(),
        body: templateBody.trim(),
        issueTags: issueTags?.filter((t) => t.trim()) || [],
        userId: user.id,
        isPublic: true,
        forkedFrom: forkedFromId,
        moderationStatus: "pending",
      })
      .returning({
        id: templates.id,
        slug: templates.slug,
        title: templates.title,
        body: templates.body,
        issueTags: templates.issueTags,
        forkedFrom: templates.forkedFrom,
        moderationStatus: templates.moderationStatus,
        createdAt: templates.createdAt,
      });

    return new Response(JSON.stringify({ template: newTemplate }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fork template:", error);
    return new Response(JSON.stringify({ error: "Failed to fork template" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
