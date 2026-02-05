export const prerender = false;

import type { APIContext } from "astro";
import { createDb } from "@/db/client";
import {
  searchBills,
  getBills,
  getBillCount,
  getDistinctSubjects,
  type BillWithSponsor,
  type BillType,
} from "@/db/queries/bills";
import type { BillStatus } from "@/lib/types/legislation";
import { isValidBillType } from "@/lib/bill-utils";
import { badRequest, jsonResponse, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";

export interface SearchBillsResponse {
  bills: BillWithSponsor[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
    total: number;
  };
  availableSubjects: string[];
}

const VALID_STATUSES: BillStatus[] = [
  "introduced",
  "passed_house",
  "passed_senate",
  "resolving_differences",
  "to_president",
  "signed",
  "vetoed",
  "veto_overridden",
  "became_law",
];

function isValidStatus(status: string): status is BillStatus {
  return VALID_STATUSES.includes(status as BillStatus);
}

export async function GET(context: APIContext): Promise<Response> {
  const url = new URL(context.request.url);

  const q = url.searchParams.get("q")?.trim() || "";
  const congressParam = url.searchParams.get("congress");
  const typeParam = url.searchParams.get("type");
  const statusParam = url.searchParams.get("status");
  const subjectParam = url.searchParams.get("subject");
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(offsetParam || "0", 10) || 0, 0);

  let congress: number | undefined;
  if (congressParam) {
    congress = parseInt(congressParam, 10);
    if (isNaN(congress) || congress < 1) {
      return badRequest("Invalid congress parameter");
    }
  }

  let billType: BillType | undefined;
  if (typeParam) {
    if (!isValidBillType(typeParam)) {
      return badRequest("Invalid type parameter");
    }
    billType = typeParam;
  }

  let status: BillStatus | undefined;
  if (statusParam) {
    if (!isValidStatus(statusParam)) {
      return badRequest("Invalid status parameter");
    }
    status = statusParam;
  }

  const subject = subjectParam?.trim() || undefined;

  try {
    const config = getConfig(context.locals);
    const db = createDb(config.database.url);

    let bills: BillWithSponsor[];
    let total: number;

    const queryOptions = {
      limit: limit + 1,
      offset,
      congress,
      status,
      subject,
    };

    if (q) {
      bills = await searchBills(db, q, queryOptions);
      total = await getBillCount(db, { query: q, congress, status, subject, billType });
    } else {
      bills = await getBills(db, queryOptions);
      total = await getBillCount(db, { congress, status, subject, billType });
    }

    const hasMore = bills.length > limit;
    if (hasMore) {
      bills = bills.slice(0, limit);
    }

    if (billType) {
      bills = bills.filter((b) => b.billType === billType);
    }

    const availableSubjects = await getDistinctSubjects(db, congress);

    const response: SearchBillsResponse = {
      bills,
      pagination: {
        limit,
        offset,
        hasMore,
        total,
      },
      availableSubjects,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error searching bills:", error);
    return serverError("Failed to search bills");
  }
}
