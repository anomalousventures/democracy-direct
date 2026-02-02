/**
 * Shared Zod schemas and types for Congress legislation data.
 * Used by Congress.gov API wrapper, Senate.gov XML parser, and database schema.
 *
 * All external API responses are validated at runtime using these schemas.
 */

import { z } from "zod";

// =============================================================================
// Core Enums / Union Types
// =============================================================================

export const ChamberSchema = z.enum(["house", "senate"]);
export type Chamber = z.infer<typeof ChamberSchema>;

export const VotePositionSchema = z.enum(["yea", "nay", "not_voting", "present"]);
export type VotePosition = z.infer<typeof VotePositionSchema>;

export const BillTypeSchema = z.enum([
  "hr",
  "s",
  "hjres",
  "sjres",
  "hconres",
  "sconres",
  "hres",
  "sres",
]);
export type BillType = z.infer<typeof BillTypeSchema>;

export const BillStatusSchema = z.enum([
  "introduced",
  "passed_house",
  "passed_senate",
  "resolving_differences",
  "to_president",
  "signed",
  "vetoed",
  "veto_overridden",
  "became_law",
]);
export type BillStatus = z.infer<typeof BillStatusSchema>;

// =============================================================================
// Domain Models (internal use)
// =============================================================================

export const VoteSchema = z.object({
  id: z.string().uuid().optional(),
  rollCall: z.number().int().positive(),
  chamber: ChamberSchema,
  congress: z.number().int().positive(),
  session: z.number().int().min(1).max(2),
  date: z.coerce.date(),
  question: z.string(),
  result: z.string(),
  billNumber: z.string().nullable(),
  billTitle: z.string().nullable(),
  billSubjects: z.array(z.string()).nullable(),
  sourceUrl: z.string().url(),
  yeas: z.number().int().nonnegative(),
  nays: z.number().int().nonnegative(),
  notVoting: z.number().int().nonnegative(),
  present: z.number().int().nonnegative(),
});
export type Vote = z.infer<typeof VoteSchema>;

export const MemberVoteSchema = z.object({
  voteId: z.string().uuid(),
  bioguideId: z.string(),
  position: VotePositionSchema,
  party: z.string().optional(),
  state: z.string().length(2).optional(),
  memberName: z.string().optional(),
});
export type MemberVote = z.infer<typeof MemberVoteSchema>;

export const BillSchema = z.object({
  id: z.string().uuid().optional(),
  billNumber: z.string(),
  billType: BillTypeSchema,
  congress: z.number().int().positive(),
  title: z.string(),
  summary: z.string().nullable(),
  status: BillStatusSchema,
  subjects: z.array(z.string()),
  introducedDate: z.coerce.date(),
  latestActionDate: z.coerce.date(),
  latestActionText: z.string(),
  sponsorBioguideId: z.string().nullable(),
  congressGovUrl: z.string().url(),
});
export type Bill = z.infer<typeof BillSchema>;

export const BillSummarySchema = z.object({
  billNumber: z.string(),
  congress: z.number().int().positive(),
  versionCode: z.string(),
  actionDate: z.coerce.date(),
  actionDesc: z.string(),
  text: z.string(),
  updateDate: z.coerce.date(),
});
export type BillSummary = z.infer<typeof BillSummarySchema>;

export const ParsedBillNumberSchema = z.object({
  type: BillTypeSchema,
  number: z.number().int().positive(),
  congress: z.number().int().positive().optional(),
});
export type ParsedBillNumber = z.infer<typeof ParsedBillNumberSchema>;

// =============================================================================
// Congress.gov API Response Schemas (external validation)
// =============================================================================

export const HouseVotePartyTotalSchema = z.object({
  voteParty: z.string(),
  yeaTotal: z.number(),
  nayTotal: z.number(),
  presentTotal: z.number(),
  notVotingTotal: z.number(),
  party: z
    .object({
      name: z.string(),
      type: z.string(),
    })
    .optional(),
});

export const HouseVoteResponseSchema = z.object({
  houseRollCallVote: z.object({
    congress: z.number(),
    sessionNumber: z.number(),
    rollCallNumber: z.number(),
    result: z.string(),
    voteQuestion: z.string().optional(),
    voteType: z.string().optional(),
    startDate: z.string(),
    updateDate: z.string().optional(),
    votePartyTotal: z.array(HouseVotePartyTotalSchema).optional(),
    sourceDataURL: z.string().optional(),
  }),
});
export type HouseVoteResponse = z.infer<typeof HouseVoteResponseSchema>;

export const HouseVoteListItemSchema = z.object({
  congress: z.number(),
  sessionNumber: z.number(),
  rollCallNumber: z.number(),
  result: z.string().optional(),
  startDate: z.string(),
  updateDate: z.string().optional(),
  voteType: z.string().optional(),
  legislationNumber: z.string().optional(),
  legislationType: z.string().optional(),
  legislationUrl: z.string().optional(),
  sourceDataURL: z.string().optional(),
  url: z.string().optional(),
});

export const HouseVoteListResponseSchema = z.object({
  houseRollCallVotes: z.array(HouseVoteListItemSchema),
  pagination: z
    .object({
      count: z.number(),
      next: z.string().optional(),
    })
    .optional(),
});
export type HouseVoteListResponse = z.infer<typeof HouseVoteListResponseSchema>;

const RawHouseVoteMemberSchema = z.object({
  bioguideID: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  voteCast: z.string(),
  voteParty: z.string(),
  voteState: z.string(),
});

export const HouseVoteMemberSchema = RawHouseVoteMemberSchema.transform((raw) => ({
  bioguideId: raw.bioguideID,
  name: `${raw.firstName} ${raw.lastName}`,
  state: raw.voteState,
  party: raw.voteParty,
  vote: raw.voteCast,
}));
export type HouseVoteMember = z.infer<typeof HouseVoteMemberSchema>;

const RawHouseVoteMembersResponseSchema = z.object({
  houseRollCallVoteMemberVotes: z.object({
    congress: z.number(),
    identifier: z.number().optional(),
    result: z.string().optional(),
    results: z.array(RawHouseVoteMemberSchema),
  }),
});

export const HouseVoteMembersResponseSchema = RawHouseVoteMembersResponseSchema.transform(
  (raw) => ({
    members: raw.houseRollCallVoteMemberVotes.results.map((m) => ({
      bioguideId: m.bioguideID,
      name: `${m.firstName} ${m.lastName}`,
      state: m.voteState,
      party: m.voteParty,
      vote: m.voteCast,
    })),
  })
);
export type HouseVoteMembersResponse = z.infer<typeof HouseVoteMembersResponseSchema>;

export const BillSponsorSchema = z.object({
  bioguideId: z.string(),
  fullName: z.string(),
  party: z.string(),
  state: z.string(),
});

export const BillListItemSchema = z.object({
  congress: z.number(),
  type: z.string(),
  number: z.coerce.number(),
  title: z.string(),
  introducedDate: z.string().optional(),
  latestAction: z
    .object({
      actionDate: z.string(),
      text: z.string(),
    })
    .optional(),
  policyArea: z
    .object({
      name: z.string(),
    })
    .optional(),
  sponsors: z.array(BillSponsorSchema).optional(),
  url: z.string(),
});
export type BillListItem = z.infer<typeof BillListItemSchema>;

export const BillListResponseSchema = z.object({
  bills: z.array(BillListItemSchema),
  pagination: z
    .object({
      count: z.number(),
      next: z.string().optional(),
    })
    .optional(),
});
export type BillListResponse = z.infer<typeof BillListResponseSchema>;

export const BillDetailResponseSchema = z.object({
  bill: z.object({
    congress: z.number(),
    type: z.string(),
    number: z.coerce.number(),
    title: z.string(),
    introducedDate: z.string().optional(),
    latestAction: z
      .object({
        actionDate: z.string(),
        text: z.string(),
      })
      .optional(),
    policyArea: z
      .object({
        name: z.string(),
      })
      .optional(),
    subjects: z
      .object({
        count: z.number(),
        url: z.string(),
      })
      .optional(),
    sponsors: z.array(BillSponsorSchema).optional(),
    summaries: z
      .object({
        count: z.number(),
        url: z.string(),
      })
      .optional(),
  }),
});
export type BillDetailResponse = z.infer<typeof BillDetailResponseSchema>;

export const BillSummariesResponseSchema = z.object({
  summaries: z.array(
    z.object({
      versionCode: z.string(),
      actionDate: z.string(),
      actionDesc: z.string(),
      text: z.string(),
      updateDate: z.string(),
    })
  ),
});
export type BillSummariesResponse = z.infer<typeof BillSummariesResponseSchema>;

// =============================================================================
// Senate.gov XML Parsed Schemas (after XML parsing)
// =============================================================================

export const SenateVoteMemberSchema = z.object({
  memberFull: z.string(),
  lastName: z.string(),
  firstName: z.string().optional(),
  party: z.string(),
  state: z.string(),
  voteCast: z.string(),
  lisMemberId: z.string(),
});
export type SenateVoteMember = z.infer<typeof SenateVoteMemberSchema>;

export const ParsedSenateVoteSchema = z.object({
  congress: z.number().int().positive(),
  session: z.number().int().min(1).max(2),
  voteNumber: z.number().int().positive(),
  voteDate: z.string(),
  question: z.string(),
  result: z.string(),
  yeas: z.number().int().nonnegative(),
  nays: z.number().int().nonnegative(),
  notVoting: z.number().int().nonnegative(),
  present: z.number().int().nonnegative(),
  members: z.array(SenateVoteMemberSchema),
  documentName: z.string().optional(),
  documentTitle: z.string().optional(),
});
export type ParsedSenateVote = z.infer<typeof ParsedSenateVoteSchema>;

export const ParsedVoteMenuItemSchema = z.object({
  voteNumber: z.number().int().positive(),
  voteDate: z.string(),
  issue: z.string().optional(),
  question: z.string(),
  result: z.string(),
  yeas: z.number().int().nonnegative().optional(),
  nays: z.number().int().nonnegative().optional(),
});
export type ParsedVoteMenuItem = z.infer<typeof ParsedVoteMenuItemSchema>;

export const ParsedVoteMenuSchema = z.object({
  congress: z.number().int().positive(),
  session: z.number().int().min(1).max(2),
  votes: z.array(ParsedVoteMenuItemSchema),
});
export type ParsedVoteMenu = z.infer<typeof ParsedVoteMenuSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Safely parse an API response with a Zod schema.
 * Returns { success: true, data } or { success: false, error }.
 */
export function safeParseResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Parse an API response, throwing a descriptive error if validation fails.
 */
export function parseResponse<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const prefix = context ? `${context}: ` : "";
  const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
  throw new Error(`${prefix}Invalid response data: ${issues}`);
}
