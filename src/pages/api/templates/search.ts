import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { getConfig } from "@/lib/config";
import { jsonResponse, badRequest, serverError } from "@/lib/api-response";
import { createLogger } from "@/lib/logger";
import { searchTemplatesWithCursor, getApprovedTagNames } from "@/db/queries/templates";
import { normalizeBillNumber } from "@/lib/bill-utils";

export const prerender = false;

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export const GET: APIRoute = async ({ url, locals, request }) => {
  const logger = createLogger(locals, request);

  const limitParam = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const tagsParam = url.searchParams.get("tags");
  const billParam = url.searchParams.get("bill");
  let bill: string | undefined;
  if (billParam) {
    const normalized = normalizeBillNumber(billParam);
    bill = normalized ?? undefined;
  }

  let limit = DEFAULT_LIMIT;
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return badRequest("Invalid limit parameter");
    }
    limit = Math.min(parsedLimit, MAX_LIMIT);
  }

  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : undefined;

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const [result, availableTags] = await Promise.all([
      searchTemplatesWithCursor(db, { limit, cursor, search, tags, bill }),
      getApprovedTagNames(db),
    ]);

    return jsonResponse({
      templates: result.items,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
      availableTags,
    });
  } catch (error) {
    logger.error("template_search_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      search,
      tags,
      cursor,
    });
    return serverError("Failed to search templates");
  }
};
