import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateTemplate } from "@/lib/template-validation";
import { getRequiredEnv } from "@/lib/env";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const { slug } = params;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));

    const [template] = await db.select().from(templates).where(eq(templates.slug, slug)).limit(1);

    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ template }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch template" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  const { slug } = params;

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
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
  } = body as {
    title?: string;
    body?: string;
    issueTags?: string[];
  };

  if (!title || !templateBody) {
    return new Response(JSON.stringify({ error: "Title and body are required" }), {
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

  try {
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));

    const [existingTemplate] = await db
      .select({ id: templates.id, userId: templates.userId })
      .from(templates)
      .where(eq(templates.slug, slug))
      .limit(1);

    if (!existingTemplate) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingTemplate.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [updatedTemplate] = await db
      .update(templates)
      .set({
        title: title.trim(),
        body: templateBody.trim(),
        issueTags: issueTags?.filter((t) => t.trim()) || [],
        moderationStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(templates.id, existingTemplate.id))
      .returning();

    return new Response(JSON.stringify({ template: updatedTemplate }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update template:", error);
    return new Response(JSON.stringify({ error: "Failed to update template" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  const { slug } = params;

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));

    const [existingTemplate] = await db
      .select({ id: templates.id, userId: templates.userId })
      .from(templates)
      .where(eq(templates.slug, slug))
      .limit(1);

    if (!existingTemplate) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingTemplate.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.delete(templates).where(eq(templates.id, existingTemplate.id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return new Response(JSON.stringify({ error: "Failed to delete template" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
