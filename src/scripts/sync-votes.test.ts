import { describe, it, expect } from "vitest";
import { buildCongressGovVoteUrl } from "./sync-votes";

describe("buildCongressGovVoteUrl", () => {
  it("builds correct URL for single-digit roll call", () => {
    const date = new Date("2025-01-15");
    const url = buildCongressGovVoteUrl(date, 1);
    expect(url).toBe("https://clerk.house.gov/Votes/2025001");
  });

  it("builds correct URL for two-digit roll call", () => {
    const date = new Date("2025-02-20");
    const url = buildCongressGovVoteUrl(date, 42);
    expect(url).toBe("https://clerk.house.gov/Votes/2025042");
  });

  it("builds correct URL for three-digit roll call", () => {
    const date = new Date("2025-06-10");
    const url = buildCongressGovVoteUrl(date, 123);
    expect(url).toBe("https://clerk.house.gov/Votes/2025123");
  });

  it("builds correct URL for four-digit roll call", () => {
    const date = new Date("2024-12-01");
    const url = buildCongressGovVoteUrl(date, 1234);
    expect(url).toBe("https://clerk.house.gov/Votes/20241234");
  });

  it("uses year from the vote date, not current year", () => {
    const date = new Date("2023-03-15");
    const url = buildCongressGovVoteUrl(date, 50);
    expect(url).toBe("https://clerk.house.gov/Votes/2023050");
  });
});
