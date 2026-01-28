import type { APIRoute } from "astro";
import { eq, or } from "drizzle-orm";
import { createDb } from "@/db/client";
import { tagSuggestions } from "@/db/schema";
import { jsonResponse, badRequest, conflict, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";
import { z } from "zod";

export const prerender = false;

const suggestSchema = z.object({
  name: z
    .string()
    .min(2, "Tag name must be at least 2 characters")
    .max(50, "Tag name must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Tag name must be lowercase alphanumeric with hyphens only")
    .transform((s) => s.toLowerCase().trim()),
});

export const POST: APIRoute = async ({ locals, request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const result = suggestSchema.safeParse(body);
  if (!result.success) {
    return badRequest(result.error.issues[0]?.message ?? "Invalid tag name");
  }

  const { name } = result.data;

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const existing = await db
      .select()
      .from(tagSuggestions)
      .where(or(eq(tagSuggestions.name, name), eq(tagSuggestions.status, "approved")));

    const existingWithName = existing.find((t) => t.name === name);
    if (existingWithName) {
      return conflict("Tag already exists or is pending review");
    }

    const [newTag] = await db
      .insert(tagSuggestions)
      .values({
        name,
        suggestedBy: locals.user?.id ?? null,
        status: "pending",
      })
      .returning();

    return jsonResponse({ tag: newTag });
  } catch (error) {
    console.error("Failed to suggest tag:", error);
    return serverError("Failed to suggest tag");
  }
};
