import { eq, and, desc, count } from "drizzle-orm";
import type { Database } from "../client";
import { votes, memberVotes, legislators, type Vote, type MemberVote } from "../schema";
import type { VotePosition, Chamber } from "@/lib/types/legislation";

export interface VoteWithPosition extends Vote {
  position: VotePosition;
}

export interface MemberVoteWithLegislator extends MemberVote {
  fullName: string;
  party: string;
  state: string;
  chamber: string;
}

export interface VoteStats {
  totalVotes: number;
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
}

export async function getVoteById(db: Database, voteId: string): Promise<Vote | null> {
  const results = await db.select().from(votes).where(eq(votes.id, voteId)).limit(1);
  return results[0] ?? null;
}

export async function getVoteByRollCall(
  db: Database,
  chamber: Chamber,
  congress: number,
  session: number,
  rollCall: number
): Promise<Vote | null> {
  const results = await db
    .select()
    .from(votes)
    .where(
      and(
        eq(votes.chamber, chamber),
        eq(votes.congress, congress),
        eq(votes.session, session),
        eq(votes.rollCall, rollCall)
      )
    )
    .limit(1);
  return results[0] ?? null;
}

export interface GetVotesByMemberOptions {
  limit?: number;
  offset?: number;
  congress?: number;
  chamber?: Chamber;
}

export async function getVotesByMember(
  db: Database,
  bioguideId: string,
  options: GetVotesByMemberOptions = {}
): Promise<VoteWithPosition[]> {
  const { limit = 50, offset = 0, congress, chamber } = options;

  const conditions = [eq(memberVotes.bioguideId, bioguideId)];

  if (congress) {
    conditions.push(eq(votes.congress, congress));
  }

  if (chamber) {
    conditions.push(eq(votes.chamber, chamber));
  }

  const results = await db
    .select({
      id: votes.id,
      rollCall: votes.rollCall,
      chamber: votes.chamber,
      congress: votes.congress,
      session: votes.session,
      date: votes.date,
      question: votes.question,
      result: votes.result,
      billNumber: votes.billNumber,
      billTitle: votes.billTitle,
      billSubjects: votes.billSubjects,
      sourceUrl: votes.sourceUrl,
      yeas: votes.yeas,
      nays: votes.nays,
      notVoting: votes.notVoting,
      present: votes.present,
      createdAt: votes.createdAt,
      position: memberVotes.position,
    })
    .from(memberVotes)
    .innerJoin(votes, eq(memberVotes.voteId, votes.id))
    .where(and(...conditions))
    .orderBy(desc(votes.date))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function getVoteStats(
  db: Database,
  bioguideId: string,
  congress?: number
): Promise<VoteStats> {
  const conditions = [eq(memberVotes.bioguideId, bioguideId)];

  if (congress) {
    conditions.push(eq(votes.congress, congress));
  }

  const results = await db
    .select({
      position: memberVotes.position,
      count: count(),
    })
    .from(memberVotes)
    .innerJoin(votes, eq(memberVotes.voteId, votes.id))
    .where(and(...conditions))
    .groupBy(memberVotes.position);

  const stats: VoteStats = {
    totalVotes: 0,
    yeas: 0,
    nays: 0,
    notVoting: 0,
    present: 0,
  };

  const positionToStat: Record<string, keyof Omit<VoteStats, "totalVotes">> = {
    yea: "yeas",
    nay: "nays",
    not_voting: "notVoting",
    present: "present",
  };

  for (const row of results) {
    const positionCount = Number(row.count);
    stats.totalVotes += positionCount;

    const statKey = positionToStat[row.position];
    if (statKey) {
      stats[statKey] = positionCount;
    }
  }

  return stats;
}

export async function getMemberVotesForVote(
  db: Database,
  voteId: string
): Promise<MemberVoteWithLegislator[]> {
  const results = await db
    .select({
      voteId: memberVotes.voteId,
      bioguideId: memberVotes.bioguideId,
      position: memberVotes.position,
      fullName: legislators.fullName,
      party: legislators.party,
      state: legislators.state,
      chamber: legislators.chamber,
    })
    .from(memberVotes)
    .innerJoin(legislators, eq(memberVotes.bioguideId, legislators.bioguideId))
    .where(eq(memberVotes.voteId, voteId));

  return results;
}

export async function getVoteWithMembers(
  db: Database,
  voteId: string
): Promise<(Vote & { members: MemberVoteWithLegislator[] }) | null> {
  const vote = await getVoteById(db, voteId);
  if (!vote) {
    return null;
  }

  const members = await getMemberVotesForVote(db, voteId);

  return {
    ...vote,
    members,
  };
}

export interface GetVotesByChamberOptions {
  limit?: number;
  offset?: number;
  congress?: number;
  session?: number;
}

export async function getVotesByChamber(
  db: Database,
  chamber: Chamber,
  options: GetVotesByChamberOptions = {}
): Promise<Vote[]> {
  const { limit = 50, offset = 0, congress, session } = options;

  const conditions = [eq(votes.chamber, chamber)];

  if (congress) {
    conditions.push(eq(votes.congress, congress));
  }

  if (session) {
    conditions.push(eq(votes.session, session));
  }

  return db
    .select()
    .from(votes)
    .where(and(...conditions))
    .orderBy(desc(votes.date))
    .limit(limit)
    .offset(offset);
}
