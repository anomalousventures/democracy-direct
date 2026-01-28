import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { templates, templateFlags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequiredEnv } from "@/lib/env";

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
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: "Template slug is required" }), {
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

  const { reason, details } = body as {
    reason?: string;
    details?: string;
  };

  if (!reason || !FLAG_REASONS.includes(reason as FlagReason)) {
    return new Response(
      JSON.stringify({
        error: "Invalid flag reason",
        validReasons: FLAG_REASONS,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
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
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existingFlags = await db
      .select({ id: templateFlags.id })
      .from(templateFlags)
      .where(and(eq(templateFlags.templateId, template.id), eq(templateFlags.userId, user.id)));

    if (existingFlags.length >= MAX_FLAGS_PER_USER_PER_TEMPLATE) {
      return new Response(JSON.stringify({ error: "You have already flagged this template" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.insert(templateFlags).values({
      templateId: template.id,
      userId: user.id,
      reason,
      details: details?.trim() || null,
    });

    const newFlagCount = template.flagCount + 1;

    const updateData: { flagCount: number; moderationStatus?: string } = {
      flagCount: newFlagCount,
    };

    if (newFlagCount >= FLAG_HIDE_THRESHOLD) {
      updateData.moderationStatus = "flagged";
    }

    await db.update(templates).set(updateData).where(eq(templates.id, template.id));

    return new Response(
      JSON.stringify({
        success: true,
        message:
          newFlagCount >= FLAG_HIDE_THRESHOLD
            ? "Template flagged and hidden for review"
            : "Template flagged successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to flag template:", error);
    return new Response(JSON.stringify({ error: "Failed to flag template" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
