export const prerender = false;

import type { APIRoute } from "astro";
import { and, eq, isNull, or } from "drizzle-orm";
import { createDb } from "@/db/client";
import { legislators } from "@/db/schema";
import { badRequest, jsonResponse, notFound, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";
import { createLogger, type Logger } from "@/lib/logger";
import { DISTRICT_PATTERN } from "@/lib/saved-district";
import { isValidState } from "@/lib/states";

const AT_LARGE_VALUES = new Set(["00", "0", "AL"]);

const REP_COLUMNS = {
  bioguideId: true,
  fullName: true,
  party: true,
  state: true,
  district: true,
} as const;

function isAtLarge(district: string): boolean {
  return AT_LARGE_VALUES.has(district.toUpperCase());
}

export const GET: APIRoute = async ({ url, locals, request }) => {
  const logger = createLogger(locals, request);
  const state = url.searchParams.get("state")?.toUpperCase();
  const district = url.searchParams.get("district")?.toUpperCase();
  const chamber = url.searchParams.get("chamber")?.toLowerCase();

  if (chamber === "senate") {
    if (!state) {
      return badRequest("state query parameter is required");
    }
    if (!isValidState(state)) {
      return badRequest("Invalid state code");
    }
    return fetchSenators(state, locals, logger);
  }

  if (!state || !district) {
    return badRequest("state and district query parameters are required");
  }

  if (!isValidState(state)) {
    return badRequest("Invalid state code");
  }

  if (!DISTRICT_PATTERN.test(district)) {
    return badRequest("Invalid district (must be 1-2 digits or AL)");
  }

  const normalizedDistrict = isAtLarge(district) ? district : String(parseInt(district, 10));
  return fetchHouseRep(state, normalizedDistrict, locals, logger);
};

async function fetchSenators(state: string, locals: App.Locals, logger: Logger): Promise<Response> {
  try {
    const db = createDb(getConfig(locals).database.url);

    const senators = await db.query.legislators.findMany({
      columns: REP_COLUMNS,
      where: and(eq(legislators.state, state), eq(legislators.chamber, "senate")),
    });

    if (senators.length === 0) {
      return notFound("No senators found for this state");
    }

    return jsonResponse(senators);
  } catch (error) {
    logger.error("senators_fetch_failed", {
      state,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return serverError("Failed to fetch senators");
  }
}

async function fetchHouseRep(
  state: string,
  district: string,
  locals: App.Locals,
  logger: Logger
): Promise<Response> {
  try {
    const db = createDb(getConfig(locals).database.url);

    const districtCondition = isAtLarge(district)
      ? or(
          eq(legislators.district, "0"),
          eq(legislators.district, "00"),
          eq(legislators.district, "AL"),
          isNull(legislators.district)
        )
      : eq(legislators.district, district);

    const rep = await db.query.legislators.findFirst({
      columns: REP_COLUMNS,
      where: and(eq(legislators.state, state), eq(legislators.chamber, "house"), districtCondition),
    });

    if (!rep) {
      return notFound("No representative found for this district");
    }

    return jsonResponse(rep);
  } catch (error) {
    logger.error("house_rep_fetch_failed", {
      state,
      district,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return serverError("Failed to fetch representative");
  }
}
