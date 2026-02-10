/**
 * Congress.gov API wrapper with typed responses, rate limiting, and error handling.
 * API documentation: https://api.congress.gov/
 *
 * All API responses are validated at runtime using Zod schemas.
 */

import {
  type HouseVoteResponse,
  type HouseVoteListResponse,
  type HouseVoteMembersResponse,
  type BillListResponse,
  type BillDetailResponse,
  type BillSummariesResponse,
  type BillAmendmentsResponse,
  type AmendmentDetailResponse,
  type SponsoredLegislationResponse,
  type BillType,
  HouseVoteResponseSchema,
  HouseVoteListResponseSchema,
  HouseVoteMembersResponseSchema,
  BillListResponseSchema,
  BillDetailResponseSchema,
  BillSummariesResponseSchema,
  BillAmendmentsResponseSchema,
  AmendmentDetailResponseSchema,
  SponsoredLegislationResponseSchema,
  parseResponse,
} from "@/lib/types/legislation";

const BASE_URL = "https://api.congress.gov/v3";

export class CongressApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "CongressApiError";
  }
}

export interface CongressClientOptions {
  apiKey: string;
  minDelayMs?: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface ListBillsOptions extends PaginationOptions {
  congress?: number;
  fromDateTime?: string;
  sort?: "updateDate" | "updateDate+asc" | "updateDate+desc";
}

export type ListHouseVotesOptions = PaginationOptions;

export interface CongressClient {
  getHouseVote(congress: number, session: number, rollCall: number): Promise<HouseVoteResponse>;

  getHouseVoteMembers(
    congress: number,
    session: number,
    rollCall: number
  ): Promise<HouseVoteMembersResponse>;

  listHouseVotes(
    congress: number,
    session: number,
    options?: ListHouseVotesOptions
  ): Promise<HouseVoteListResponse>;

  listBills(options?: ListBillsOptions): Promise<BillListResponse>;

  getBill(
    congress: number,
    billType: BillType | string,
    billNumber: number
  ): Promise<BillDetailResponse>;

  getBillSummaries(
    congress: number,
    billType: BillType | string,
    billNumber: number
  ): Promise<BillSummariesResponse>;

  listBillAmendments(
    congress: number,
    billType: BillType | string,
    billNumber: number,
    options?: PaginationOptions
  ): Promise<BillAmendmentsResponse>;

  getAmendment(
    congress: number,
    amendmentType: string,
    amendmentNumber: string
  ): Promise<AmendmentDetailResponse>;

  getSponsoredBills(
    bioguideId: string,
    options?: PaginationOptions
  ): Promise<SponsoredLegislationResponse>;
}

export function createCongressClient(options: CongressClientOptions): CongressClient {
  const { apiKey, minDelayMs = 0 } = options;
  let lastRequestTime = 0;

  async function rateLimitedFetch(url: string): Promise<Response> {
    if (minDelayMs > 0) {
      const now = Date.now();
      const elapsed = now - lastRequestTime;
      if (elapsed < minDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
      }
    }
    lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new CongressApiError(
          `Congress.gov API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error instanceof CongressApiError) {
        throw error;
      }
      throw new CongressApiError(
        `Congress.gov API request failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  function buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("api_key", apiKey);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  return {
    async getHouseVote(
      congress: number,
      session: number,
      rollCall: number
    ): Promise<HouseVoteResponse> {
      const url = buildUrl(`/house-vote/${congress}/${session}/${rollCall}`);
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        HouseVoteResponseSchema,
        data,
        `getHouseVote(${congress}/${session}/${rollCall})`
      );
    },

    async getHouseVoteMembers(
      congress: number,
      session: number,
      rollCall: number
    ): Promise<HouseVoteMembersResponse> {
      const url = buildUrl(`/house-vote/${congress}/${session}/${rollCall}/members`);
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        HouseVoteMembersResponseSchema,
        data,
        `getHouseVoteMembers(${congress}/${session}/${rollCall})`
      );
    },

    async listHouseVotes(
      congress: number,
      session: number,
      options: ListHouseVotesOptions = {}
    ): Promise<HouseVoteListResponse> {
      const params: Record<string, string> = {};
      if (options.limit !== undefined) params.limit = options.limit.toString();
      if (options.offset !== undefined) params.offset = options.offset.toString();

      const url = buildUrl(`/house-vote/${congress}/${session}`, params);
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        HouseVoteListResponseSchema,
        data,
        `listHouseVotes(${congress}/${session})`
      );
    },

    async listBills(options: ListBillsOptions = {}): Promise<BillListResponse> {
      const params: Record<string, string> = {};
      if (options.limit !== undefined) params.limit = options.limit.toString();
      if (options.offset !== undefined) params.offset = options.offset.toString();
      if (options.fromDateTime !== undefined) params.fromDateTime = options.fromDateTime;
      if (options.sort !== undefined) params.sort = options.sort;

      const path = options.congress ? `/bill/${options.congress}` : "/bill";
      const url = buildUrl(path, params);
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(BillListResponseSchema, data, "listBills");
    },

    async getBill(
      congress: number,
      billType: BillType | string,
      billNumber: number
    ): Promise<BillDetailResponse> {
      const url = buildUrl(`/bill/${congress}/${billType.toLowerCase()}/${billNumber}`);
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        BillDetailResponseSchema,
        data,
        `getBill(${congress}/${billType}/${billNumber})`
      );
    },

    async getBillSummaries(
      congress: number,
      billType: BillType | string,
      billNumber: number
    ): Promise<BillSummariesResponse> {
      const url = buildUrl(`/bill/${congress}/${billType.toLowerCase()}/${billNumber}/summaries`);
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        BillSummariesResponseSchema,
        data,
        `getBillSummaries(${congress}/${billType}/${billNumber})`
      );
    },

    async listBillAmendments(
      congress: number,
      billType: BillType | string,
      billNumber: number,
      options: PaginationOptions = {}
    ): Promise<BillAmendmentsResponse> {
      const params: Record<string, string> = {};
      if (options.limit !== undefined) params.limit = options.limit.toString();
      if (options.offset !== undefined) params.offset = options.offset.toString();

      const url = buildUrl(
        `/bill/${congress}/${billType.toLowerCase()}/${billNumber}/amendments`,
        params
      );
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        BillAmendmentsResponseSchema,
        data,
        `listBillAmendments(${congress}/${billType}/${billNumber})`
      );
    },

    async getAmendment(
      congress: number,
      amendmentType: string,
      amendmentNumber: string
    ): Promise<AmendmentDetailResponse> {
      const url = buildUrl(
        `/amendment/${congress}/${amendmentType.toLowerCase()}/${amendmentNumber}`
      );
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        AmendmentDetailResponseSchema,
        data,
        `getAmendment(${congress}/${amendmentType}/${amendmentNumber})`
      );
    },

    async getSponsoredBills(
      bioguideId: string,
      options: PaginationOptions = {}
    ): Promise<SponsoredLegislationResponse> {
      const params: Record<string, string> = {};
      if (options.limit !== undefined) params.limit = options.limit.toString();
      if (options.offset !== undefined) params.offset = options.offset.toString();

      const url = buildUrl(`/member/${bioguideId}/sponsored-legislation`, params);
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      return parseResponse(
        SponsoredLegislationResponseSchema,
        data,
        `getSponsoredBills(${bioguideId})`
      );
    },
  };
}

/**
 * Gets the current Congress number based on the year.
 * Congress numbers: 119th starts Jan 2025, 118th was Jan 2023 - Jan 2025.
 */
export function getCurrentCongress(): number {
  const year = new Date().getFullYear();
  return Math.floor((year - 1789) / 2) + 1;
}

/**
 * Gets the current session (1 or 2) based on the year.
 * Session 1 is odd years, session 2 is even years.
 */
export function getCurrentSession(): 1 | 2 {
  const year = new Date().getFullYear();
  return (year % 2 === 1 ? 1 : 2) as 1 | 2;
}

// Re-export types for convenience
export type {
  HouseVoteResponse,
  HouseVoteListResponse,
  HouseVoteMembersResponse,
  BillListResponse,
  BillDetailResponse,
  BillSummariesResponse,
  BillAmendmentsResponse,
  AmendmentDetailResponse,
  SponsoredLegislationResponse,
};
