import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { votes, memberVotes, legislators } from "@/db/schema";
import {
  getVoteById,
  getVoteByRollCall,
  getVotesByMember,
  getVoteStats,
  getMemberVotesForVote,
  getVoteWithMembers,
  getVotesByChamber,
} from "./votes";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for integration tests");
}

describe("votes queries (integration)", () => {
  let db: Database;
  let testVoteId: string;
  const testBioguideId = "T000001";

  beforeAll(async () => {
    db = createDb(DATABASE_URL!);

    await db
      .insert(legislators)
      .values({
        bioguideId: testBioguideId,
        firstName: "Test",
        lastName: "Legislator",
        fullName: "Test Legislator",
        party: "D",
        state: "CA",
        chamber: "house",
        title: "Representative",
      })
      .onConflictDoNothing();

    const [vote] = await db
      .insert(votes)
      .values({
        rollCall: 99999,
        chamber: "house",
        congress: 119,
        session: 1,
        date: new Date("2025-01-15"),
        question: "Test Vote Question",
        result: "Passed",
        sourceUrl: "https://example.com/test-vote",
        yeas: 250,
        nays: 180,
        notVoting: 5,
        present: 0,
      })
      .onConflictDoUpdate({
        target: [votes.chamber, votes.congress, votes.session, votes.rollCall],
        set: { question: "Test Vote Question" },
      })
      .returning({ id: votes.id });

    testVoteId = vote.id;

    await db
      .insert(memberVotes)
      .values({
        voteId: testVoteId,
        bioguideId: testBioguideId,
        position: "yea",
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await db.delete(memberVotes).where(eq(memberVotes.voteId, testVoteId));
    await db.delete(votes).where(eq(votes.id, testVoteId));
    await db.delete(legislators).where(eq(legislators.bioguideId, testBioguideId));
  });

  describe("getVoteById", () => {
    it("returns vote when found", async () => {
      const vote = await getVoteById(db, testVoteId);
      expect(vote).not.toBeNull();
      expect(vote?.rollCall).toBe(99999);
      expect(vote?.question).toBe("Test Vote Question");
    });

    it("returns null for non-existent vote", async () => {
      const vote = await getVoteById(db, "00000000-0000-0000-0000-000000000000");
      expect(vote).toBeNull();
    });
  });

  describe("getVoteByRollCall", () => {
    it("returns vote when found by roll call details", async () => {
      const vote = await getVoteByRollCall(db, "house", 119, 1, 99999);
      expect(vote).not.toBeNull();
      expect(vote?.id).toBe(testVoteId);
    });

    it("returns null for non-existent roll call", async () => {
      const vote = await getVoteByRollCall(db, "house", 119, 1, 88888);
      expect(vote).toBeNull();
    });
  });

  describe("getVotesByMember", () => {
    it("returns votes for a member", async () => {
      const memberVotesResult = await getVotesByMember(db, testBioguideId);
      expect(memberVotesResult.length).toBeGreaterThanOrEqual(1);

      const testVote = memberVotesResult.find((v) => v.id === testVoteId);
      expect(testVote).toBeDefined();
      expect(testVote?.position).toBe("yea");
    });

    it("respects limit option", async () => {
      const memberVotesResult = await getVotesByMember(db, testBioguideId, { limit: 1 });
      expect(memberVotesResult.length).toBeLessThanOrEqual(1);
    });

    it("returns empty array for non-existent member", async () => {
      const memberVotesResult = await getVotesByMember(db, "NONEXISTENT");
      expect(memberVotesResult).toEqual([]);
    });
  });

  describe("getVoteStats", () => {
    it("returns vote statistics for a member", async () => {
      const stats = await getVoteStats(db, testBioguideId);
      expect(stats.totalVotes).toBeGreaterThanOrEqual(1);
      expect(stats.yeas).toBeGreaterThanOrEqual(1);
    });

    it("returns zero stats for non-existent member", async () => {
      const stats = await getVoteStats(db, "NONEXISTENT");
      expect(stats.totalVotes).toBe(0);
    });
  });

  describe("getMemberVotesForVote", () => {
    it("returns member votes for a vote", async () => {
      const members = await getMemberVotesForVote(db, testVoteId);
      expect(members.length).toBeGreaterThanOrEqual(1);

      const testMember = members.find((m) => m.bioguideId === testBioguideId);
      expect(testMember).toBeDefined();
      expect(testMember?.position).toBe("yea");
      expect(testMember?.fullName).toBe("Test Legislator");
    });
  });

  describe("getVoteWithMembers", () => {
    it("returns vote with member details", async () => {
      const result = await getVoteWithMembers(db, testVoteId);
      expect(result).not.toBeNull();
      expect(result?.rollCall).toBe(99999);
      expect(result?.members.length).toBeGreaterThanOrEqual(1);
    });

    it("returns null for non-existent vote", async () => {
      const result = await getVoteWithMembers(db, "00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });
  });

  describe("getVotesByChamber", () => {
    it("returns votes for a chamber", async () => {
      const chamberVotes = await getVotesByChamber(db, "house");
      expect(chamberVotes.length).toBeGreaterThanOrEqual(1);
    });

    it("filters by congress", async () => {
      const chamberVotes = await getVotesByChamber(db, "house", { congress: 119 });
      expect(chamberVotes.every((v) => v.congress === 119)).toBe(true);
    });
  });
});
