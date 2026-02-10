export const prerender = false;

import type { APIContext } from "astro";
import { createDb } from "@/db/client";
import { getBillByNumber } from "@/db/queries/bills";
import { getVoteSummariesForBill, type BillVoteSummary } from "@/db/queries/votes";
import { parseBillId } from "@/lib/bill-utils";
import { notFound, badRequest, jsonResponse, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";

export type { BillVoteSummary };

export interface BillVotesResponse {
  billVotes: BillVoteSummary[];
  amendmentVotes: BillVoteSummary[];
}

export async function GET(context: APIContext): Promise<Response> {
  const { billId } = context.params;

  if (!billId) {
    return badRequest("Bill ID is required");
  }

  const parsed = parseBillId(billId);
  if (!parsed || parsed.congress === undefined) {
    return badRequest("Invalid bill ID format. Expected format: hr1234-119");
  }

  try {
    const config = getConfig(context.locals);
    const db = createDb(config.database.url);

    const bill = await getBillByNumber(db, parsed.congress, parsed.type, String(parsed.number));

    if (!bill) {
      return notFound("Bill not found");
    }

    const { billVotes, amendmentVotes } = await getVoteSummariesForBill(db, bill.id);

    const response: BillVotesResponse = { billVotes, amendmentVotes };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error fetching bill votes:", error);
    return serverError("Failed to fetch bill votes");
  }
}
