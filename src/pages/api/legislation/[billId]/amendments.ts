export const prerender = false;

import type { APIContext } from "astro";
import { createDb } from "@/db/client";
import { getBillByNumber } from "@/db/queries/bills";
import { getAmendmentsByBill, type AmendmentWithRelations } from "@/db/queries/amendments";
import { parseBillId } from "@/lib/bill-utils";
import { notFound, badRequest, jsonResponse, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";

export interface BillAmendmentsResponse {
  amendments: AmendmentWithRelations[];
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

    const amendments = await getAmendmentsByBill(db, bill.id);

    const response: BillAmendmentsResponse = {
      amendments,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error fetching bill amendments:", error);
    return serverError("Failed to fetch bill amendments");
  }
}
