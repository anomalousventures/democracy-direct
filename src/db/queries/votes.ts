import { eq, and, desc, count } from "drizzle-orm";
import type { Database } from "../client";
import {
  votes,
  memberVotes,
  bills,
  amendments,
  type Vote,
  type MemberVote,
  type Legislator,
} from "../schema";
import type { VotePosition, Chamber } from "@/lib/types/legislation";

export interface VoteWithPosition extends Vote {
  position: VotePosition;
}

export interface VoteWithRelations extends Vote {
  position: VotePosition;
  bill: { id: string; title: string; summary: string | null } | null;
  amendment: { id: string; description: string | null; purpose: string | null } | null;
}

export type MemberVoteWithLegislator = MemberVote & { legislator: Legislator };

export interface VoteStats {
  totalVotes: number;
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
}

export async function getVoteById(db: Database, voteId: string): Promise<Vote | null> {
  const [result] = await db.select().from(votes).where(eq(votes.id, voteId)).limit(1);
  return result ?? null;
}

export async function getVoteByRollCall(
  db: Database,
  chamber: Chamber,
  congress: number,
  session: number,
  rollCall: number
): Promise<Vote | null> {
  const [result] = await db
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
  return result ?? null;
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
      billId: votes.billId,
      amendmentId: votes.amendmentId,
      legislationType: votes.legislationType,
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
  congress?: number,
  chamber?: Chamber
): Promise<VoteStats> {
  const conditions = [eq(memberVotes.bioguideId, bioguideId)];

  if (congress) {
    conditions.push(eq(votes.congress, congress));
  }

  if (chamber) {
    conditions.push(eq(votes.chamber, chamber));
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
  return db.query.memberVotes.findMany({
    where: eq(memberVotes.voteId, voteId),
    with: { legislator: true },
  });
}

export async function getVoteWithMembers(
  db: Database,
  voteId: string
): Promise<(Vote & { members: MemberVoteWithLegislator[] }) | null> {
  const result = await db.query.votes.findFirst({
    where: eq(votes.id, voteId),
    with: {
      memberVotes: {
        with: { legislator: true },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    members: result.memberVotes,
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

export async function getVotesByMemberWithRelations(
  db: Database,
  bioguideId: string,
  options: GetVotesByMemberOptions = {}
): Promise<VoteWithRelations[]> {
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
      billId: votes.billId,
      amendmentId: votes.amendmentId,
      legislationType: votes.legislationType,
      sourceUrl: votes.sourceUrl,
      yeas: votes.yeas,
      nays: votes.nays,
      notVoting: votes.notVoting,
      present: votes.present,
      createdAt: votes.createdAt,
      position: memberVotes.position,
      billDbId: bills.id,
      billDbTitle: bills.title,
      billDbSummary: bills.summary,
      amendmentDbId: amendments.id,
      amendmentDbDescription: amendments.description,
      amendmentDbPurpose: amendments.purpose,
    })
    .from(memberVotes)
    .innerJoin(votes, eq(memberVotes.voteId, votes.id))
    .leftJoin(bills, eq(votes.billId, bills.id))
    .leftJoin(amendments, eq(votes.amendmentId, amendments.id))
    .where(and(...conditions))
    .orderBy(desc(votes.date))
    .limit(limit)
    .offset(offset);

  return results.map((row) => ({
    id: row.id,
    rollCall: row.rollCall,
    chamber: row.chamber,
    congress: row.congress,
    session: row.session,
    date: row.date,
    question: row.question,
    result: row.result,
    billNumber: row.billNumber,
    billTitle: row.billTitle,
    billSubjects: row.billSubjects,
    billId: row.billId,
    amendmentId: row.amendmentId,
    legislationType: row.legislationType,
    sourceUrl: row.sourceUrl,
    yeas: row.yeas,
    nays: row.nays,
    notVoting: row.notVoting,
    present: row.present,
    createdAt: row.createdAt,
    position: row.position,
    bill: row.billDbId
      ? { id: row.billDbId, title: row.billDbTitle ?? "", summary: row.billDbSummary }
      : null,
    amendment: row.amendmentDbId
      ? {
          id: row.amendmentDbId,
          description: row.amendmentDbDescription,
          purpose: row.amendmentDbPurpose,
        }
      : null,
  }));
}

export interface VoteForBill extends Vote {
  memberPosition: VotePosition;
  memberBioguideId: string;
}

export async function getVotesForBill(
  db: Database,
  billId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<VoteForBill[]> {
  const { limit = 50, offset = 0 } = options;

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
      billId: votes.billId,
      amendmentId: votes.amendmentId,
      legislationType: votes.legislationType,
      sourceUrl: votes.sourceUrl,
      yeas: votes.yeas,
      nays: votes.nays,
      notVoting: votes.notVoting,
      present: votes.present,
      createdAt: votes.createdAt,
      memberPosition: memberVotes.position,
      memberBioguideId: memberVotes.bioguideId,
    })
    .from(votes)
    .innerJoin(memberVotes, eq(votes.id, memberVotes.voteId))
    .where(eq(votes.billId, billId))
    .orderBy(desc(votes.date))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function getVoteCountForBill(db: Database, billId: string): Promise<number> {
  const [result] = await db.select({ count: count() }).from(votes).where(eq(votes.billId, billId));
  return Number(result?.count ?? 0);
}

export async function getVotesByBillId(db: Database, billId: string): Promise<Vote[]> {
  return db.select().from(votes).where(eq(votes.billId, billId)).orderBy(desc(votes.date));
}

export async function getVotesByAmendmentId(db: Database, amendmentId: string): Promise<Vote[]> {
  return db
    .select()
    .from(votes)
    .where(eq(votes.amendmentId, amendmentId))
    .orderBy(desc(votes.date));
}

export interface BillVoteSummary {
  id: string;
  rollCall: number;
  chamber: string;
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
  amendmentId: string | null;
  amendmentNumber: string | null;
  amendmentPurpose: string | null;
}

export async function getVoteSummariesForBill(
  db: Database,
  billId: string
): Promise<{ billVotes: BillVoteSummary[]; amendmentVotes: BillVoteSummary[] }> {
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
      yeas: votes.yeas,
      nays: votes.nays,
      notVoting: votes.notVoting,
      present: votes.present,
      sourceUrl: votes.sourceUrl,
      amendmentId: votes.amendmentId,
      amendmentNumber: amendments.amendmentNumber,
      amendmentPurpose: amendments.purpose,
    })
    .from(votes)
    .leftJoin(amendments, eq(votes.amendmentId, amendments.id))
    .where(eq(votes.billId, billId))
    .orderBy(desc(votes.date));

  const billVotes: BillVoteSummary[] = [];
  const amendmentVotes: BillVoteSummary[] = [];

  for (const row of results) {
    const summary: BillVoteSummary = {
      id: row.id,
      rollCall: row.rollCall,
      chamber: row.chamber,
      congress: row.congress,
      session: row.session,
      date: row.date,
      question: row.question,
      result: row.result,
      yeas: row.yeas,
      nays: row.nays,
      notVoting: row.notVoting,
      present: row.present,
      sourceUrl: row.sourceUrl,
      amendmentId: row.amendmentId,
      amendmentNumber: row.amendmentNumber,
      amendmentPurpose: row.amendmentPurpose,
    };

    if (row.amendmentId) {
      amendmentVotes.push(summary);
    } else {
      billVotes.push(summary);
    }
  }

  return { billVotes, amendmentVotes };
}
