import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { getConfig } from "@/lib/config";
import { getBillsByMember, getBillCount } from "@/db/queries/bills";
import { jsonResponse, badRequest, notFound } from "@/lib/api-response";
import { createLogger } from "@/lib/logger";
import { getLegislatorByBioguideId } from "@/db/queries/legislators";
import { BillStatusSchema } from "@/lib/types/legislation";
import { BIOGUIDE_RE } from "@/lib/bioguide";

export const prerender = false;

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export const GET: APIRoute = async ({ params, url, locals, request }) => {
  const logger = createLogger(locals, request);
  const { bioguideId } = params;

  if (!bioguideId || !BIOGUIDE_RE.test(bioguideId)) {
    return badRequest("Invalid bioguideId format");
  }

  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const congressParam = url.searchParams.get("congress");
  const statusParam = url.searchParams.get("status");

  const limit = limitParam ? Math.min(parseInt(limitParam, 10), MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  if (isNaN(limit) || limit < 1) {
    return badRequest("Invalid limit parameter");
  }

  if (isNaN(offset) || offset < 0) {
    return badRequest("Invalid offset parameter");
  }

  const congress = congressParam ? parseInt(congressParam, 10) : undefined;
  if (congressParam && (isNaN(congress!) || congress! < 1)) {
    return badRequest("Invalid congress parameter");
  }

  const statusResult = statusParam
    ? BillStatusSchema.safeParse(statusParam)
    : { success: true, data: undefined };
  if (!statusResult.success) {
    return badRequest("Invalid status parameter");
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const rep = await getLegislatorByBioguideId(db, bioguideId);
    if (!rep) {
      return notFound("Representative not found");
    }

    const [bills, totalCount] = await Promise.all([
      getBillsByMember(db, bioguideId, {
        limit: limit + 1,
        offset,
        congress,
        status: statusResult.data,
      }),
      getBillCount(db, { bioguideId, congress, status: statusResult.data }),
    ]);

    const hasMore = bills.length > limit;
    const returnedBills = hasMore ? bills.slice(0, limit) : bills;

    return jsonResponse({
      bills: returnedBills,
      totalCount,
      pagination: {
        limit,
        offset,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      },
    });
  } catch (error) {
    logger.error("sponsored_bills_fetch_failed", {
      bioguideId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return jsonResponse({ error: "Failed to fetch sponsored bills" }, 500);
  }
};
