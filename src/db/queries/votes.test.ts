import { describe, it, expect } from "vitest";
import {
  getVoteById,
  getVoteByRollCall,
  getVotesByMember,
  getVoteStats,
  getMemberVotesForVote,
  getVoteWithMembers,
  getVotesByChamber,
} from "./votes";

describe("votes query module", () => {
  describe("function exports", () => {
    it("exports getVoteById function", () => {
      expect(typeof getVoteById).toBe("function");
    });

    it("exports getVoteByRollCall function", () => {
      expect(typeof getVoteByRollCall).toBe("function");
    });

    it("exports getVotesByMember function", () => {
      expect(typeof getVotesByMember).toBe("function");
    });

    it("exports getVoteStats function", () => {
      expect(typeof getVoteStats).toBe("function");
    });

    it("exports getMemberVotesForVote function", () => {
      expect(typeof getMemberVotesForVote).toBe("function");
    });

    it("exports getVoteWithMembers function", () => {
      expect(typeof getVoteWithMembers).toBe("function");
    });

    it("exports getVotesByChamber function", () => {
      expect(typeof getVotesByChamber).toBe("function");
    });
  });

  describe("type interface validation", () => {
    it("getVoteById accepts db and voteId parameters", () => {
      expect(getVoteById.length).toBeGreaterThanOrEqual(2);
    });

    it("getVoteByRollCall accepts db, chamber, congress, session, rollCall", () => {
      expect(getVoteByRollCall.length).toBeGreaterThanOrEqual(5);
    });

    it("getVotesByMember accepts db, bioguideId, options", () => {
      expect(getVotesByMember.length).toBeGreaterThanOrEqual(2);
    });

    it("getVoteStats accepts db, bioguideId, congress", () => {
      expect(getVoteStats.length).toBeGreaterThanOrEqual(2);
    });

    it("getMemberVotesForVote accepts db and voteId", () => {
      expect(getMemberVotesForVote.length).toBeGreaterThanOrEqual(2);
    });
  });
});
