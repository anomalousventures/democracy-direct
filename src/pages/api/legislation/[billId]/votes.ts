export const prerender = false;

import type { APIContext } from "astro";
import { createDb } from "@/db/client";
import { getBillByNumber } from "@/db/queries/bills";
import {
  getVotesByBillId,
  getMemberVotesForVote,
  type MemberVoteWithLegislator,
} from "@/db/queries/votes";
import { parseBillId } from "@/lib/bill-utils";
import { notFound, badRequest, jsonResponse, serverError } from "@/lib/api-response";
import { getConfig } from "@/lib/config";
import type { Vote } from "@/db/schema";
import type { Chamber } from "@/lib/types/legislation";
import type { VoteMember } from "@/lib/types/vote";

export type { VoteMember };

export interface BillVote {
  id: string;
  rollCall: number;
  chamber: Chamber;
  congress: number;
  session: number;
  date: Date;
  question: string;
  result: string;
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
  sourceUrl: string | null;
  members: VoteMember[];
}

export interface BillVotesResponse {
  votes: BillVote[];
}

function transformMemberVote(mv: MemberVoteWithLegislator): VoteMember {
  return {
    bioguideId: mv.bioguideId,
    name: mv.fullName,
    party: mv.party,
    state: mv.state,
    position: mv.position as VoteMember["position"],
  };
}

async function loadVoteWithMembers(db: ReturnType<typeof createDb>, vote: Vote): Promise<BillVote> {
  const members = await getMemberVotesForVote(db, vote.id);

  return {
    id: vote.id,
    rollCall: vote.rollCall,
    chamber: vote.chamber as Chamber,
    congress: vote.congress,
    session: vote.session,
    date: vote.date,
    question: vote.question,
    result: vote.result,
    yeas: vote.yeas,
    nays: vote.nays,
    notVoting: vote.notVoting,
    present: vote.present,
    sourceUrl: vote.sourceUrl,
    members: members.map(transformMemberVote),
  };
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

    const votes = await getVotesByBillId(db, bill.id);

    const votesWithMembers = await Promise.all(votes.map((vote) => loadVoteWithMembers(db, vote)));

    const response: BillVotesResponse = {
      votes: votesWithMembers,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error fetching bill votes:", error);
    return serverError("Failed to fetch bill votes");
  }
}
