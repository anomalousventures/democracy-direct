import { describe, it, expect } from "vitest";
import * as votesModule from "./votes";

describe("votes query module", () => {
  it("exports expected query functions", () => {
    const expectedExports = [
      "getVoteById",
      "getVoteByRollCall",
      "getVotesByMember",
      "getVoteStats",
      "getMemberVotesForVote",
      "getVoteWithMembers",
      "getVotesByChamber",
    ];

    for (const name of expectedExports) {
      expect(votesModule).toHaveProperty(name);
      expect(typeof votesModule[name as keyof typeof votesModule]).toBe("function");
    }
  });
});
