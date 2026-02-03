import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { createDb } from "@/db/client";
import { issueTags } from "@/db/schema";
import { jsonResponse, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);
    const tags = await db
      .select({ name: issueTags.name })
      .from(issueTags)
      .where(eq(issueTags.status, "approved"));

    return jsonResponse({ tags: tags.map((t) => t.name) });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return serverError("Failed to fetch tags");
  }
};
