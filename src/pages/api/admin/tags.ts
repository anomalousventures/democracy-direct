import type { APIRoute } from "astro";
import { eq, desc } from "drizzle-orm";
import { createDb } from "@/db/client";
import { tagSuggestions } from "@/db/schema";
import { jsonResponse, badRequest, serverError, notFound } from "@/lib/api-response";
import { getConfig } from "@/lib/config";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export const prerender = false;

const actionSchema = z.object({
  tagId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export const GET: APIRoute = async ({ locals }) => {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);
    const tags = await db
      .select()
      .from(tagSuggestions)
      .where(eq(tagSuggestions.status, "pending"))
      .orderBy(desc(tagSuggestions.createdAt));

    return jsonResponse({ tags });
  } catch (error) {
    console.error("Failed to fetch tag suggestions:", error);
    return serverError("Failed to fetch tag suggestions");
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const result = actionSchema.safeParse(body);
  if (!result.success) {
    return badRequest("Invalid request body");
  }

  const { tagId, action } = result.data;
  const newStatus = action === "approve" ? "approved" : "rejected";

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);
    const [updatedTag] = await db
      .update(tagSuggestions)
      .set({
        status: newStatus,
        approvedBy: locals.user?.id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(tagSuggestions.id, tagId))
      .returning();

    if (!updatedTag) {
      return notFound("Tag suggestion not found");
    }

    return jsonResponse({ tag: updatedTag });
  } catch (error) {
    console.error("Failed to update tag suggestion:", error);
    return serverError("Failed to update tag suggestion");
  }
};
