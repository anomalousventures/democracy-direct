import type { APIRoute } from "astro";
import { eq, and, gte } from "drizzle-orm";
import { createDb } from "@/db/client";
import { issueTags } from "@/db/schema";
import {
  jsonResponse,
  badRequest,
  conflict,
  serverError,
  unauthorized,
  tooManyRequests,
} from "@/lib/api-response";
import { getConfig } from "@/lib/config";
import { parseJsonBody, suggestTagBodySchema } from "@/lib/request-body";

export const prerender = false;

const RATE_LIMIT_MAX_SUGGESTIONS = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;

export const POST: APIRoute = async ({ locals, request }) => {
  if (!locals.user) {
    return unauthorized("Authentication required to suggest tags");
  }

  const parseResult = await parseJsonBody(request, suggestTagBodySchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { name } = parseResult.data;

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const recentSuggestions = await db
      .select({ id: issueTags.id })
      .from(issueTags)
      .where(and(eq(issueTags.suggestedBy, locals.user.id), gte(issueTags.createdAt, oneHourAgo)));

    if (recentSuggestions.length >= RATE_LIMIT_MAX_SUGGESTIONS) {
      return tooManyRequests("Too many suggestions. Please try again later.");
    }

    const [existingWithName] = await db
      .select({ id: issueTags.id })
      .from(issueTags)
      .where(eq(issueTags.name, name))
      .limit(1);

    if (existingWithName) {
      return conflict("Tag already exists or is pending review");
    }

    const [newTag] = await db
      .insert(issueTags)
      .values({
        name,
        suggestedBy: locals.user.id,
        status: "pending",
      })
      .returning();

    return jsonResponse({ tag: newTag });
  } catch (error) {
    console.error("Failed to suggest tag:", error);
    return serverError("Failed to suggest tag");
  }
};
