import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { createDb } from "@/db/client";
import { tagSuggestions } from "@/db/schema";
import { jsonResponse, serverError } from "@/lib/api-response";
import { getRequiredEnv } from "@/lib/env";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));
    const tags = await db
      .select({ name: tagSuggestions.name })
      .from(tagSuggestions)
      .where(eq(tagSuggestions.status, "approved"));

    return jsonResponse({ tags: tags.map((t) => t.name) });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return serverError("Failed to fetch tags");
  }
};
