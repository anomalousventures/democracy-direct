import type { APIRoute } from "astro";
import { eq, or } from "drizzle-orm";
import { createDb } from "@/db/client";
import { tagSuggestions } from "@/db/schema";
import { jsonResponse, badRequest, conflict, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";
import { parseJsonBody, suggestTagBodySchema } from "@/lib/request-body";

export const prerender = false;

export const POST: APIRoute = async ({ locals, request }) => {
  const parseResult = await parseJsonBody(request, suggestTagBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { name } = parseResult.data;

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
