import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { getConfig } from "@/lib/config";
import { getVotesByMember, getVoteStats } from "@/db/queries/votes";
import { jsonResponse, badRequest, notFound } from "@/lib/api-response";
import { createLogger } from "@/lib/logger";
import { getLegislatorByBioguideId } from "@/db/queries/legislators";
import { ChamberSchema } from "@/lib/types/legislation";
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
  const chamberParam = url.searchParams.get("chamber");

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

  const chamberResult = chamberParam
    ? ChamberSchema.safeParse(chamberParam)
    : { success: true, data: undefined };
  if (!chamberResult.success) {
    return badRequest("Invalid chamber parameter. Must be 'house' or 'senate'");
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const rep = await getLegislatorByBioguideId(db, bioguideId);
    if (!rep) {
      return notFound("Representative not found");
    }

    const [votes, stats] = await Promise.all([
      getVotesByMember(db, bioguideId, {
        limit: limit + 1,
        offset,
        congress,
        chamber: chamberResult.data,
      }),
      getVoteStats(db, bioguideId, congress, chamberResult.data),
    ]);

    const hasMore = votes.length > limit;
    const returnedVotes = hasMore ? votes.slice(0, limit) : votes;

    return jsonResponse({
      votes: returnedVotes,
      stats,
      pagination: {
        limit,
        offset,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      },
    });
  } catch (error) {
    logger.error("voting_record_fetch_failed", {
      bioguideId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return jsonResponse({ error: "Failed to fetch voting record" }, 500);
  }
};
