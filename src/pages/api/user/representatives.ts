export const prerender = false;

import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { getLegislatorsByStateAndDistrict } from "@/db/queries/legislators";
import { getConfig } from "@/lib/config";
import { badRequest, jsonResponse, serverError } from "@/lib/api-response";
import { isValidState } from "@/lib/states";
import { DISTRICT_PATTERN } from "@/lib/saved-district";

export interface RepresentativeInfo {
  bioguideId: string;
  fullName: string;
  party: string;
  state: string;
  chamber: string;
}

export interface RepresentativesResponse {
  representatives: RepresentativeInfo[];
}

export const GET: APIRoute = async ({ url, locals }) => {
  const state = url.searchParams.get("state")?.toUpperCase();
  const district = url.searchParams.get("district")?.toUpperCase();

  if (!state || !district) {
    return badRequest("state and district query parameters are required");
  }

  if (!isValidState(state)) {
    return badRequest("Invalid state code");
  }

  if (!DISTRICT_PATTERN.test(district)) {
    return badRequest("Invalid district (must be 1-2 digits or AL)");
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const reps = await getLegislatorsByStateAndDistrict(db, state, district);

    const response: RepresentativesResponse = {
      representatives: reps.map((r) => ({
        bioguideId: r.bioguideId,
        fullName: r.fullName,
        party: r.party,
        state: r.state,
        chamber: r.chamber,
      })),
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Failed to fetch representatives:", error);
    return serverError("Failed to fetch representatives");
  }
};
