import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createSenateVoteClient,
  parseSenateVoteXml,
  parseSenateVoteMenuXml,
  normalizeVotePosition,
  buildSenateVoteUrl,
  SenateApiError,
  type SenateVoteClient,
} from "./senate-votes";

const mockFetch = vi.fn();

const SAMPLE_VOTE_XML = `<?xml version="1.0" encoding="utf-8"?>
<roll_call_vote>
  <congress>119</congress>
  <session>1</session>
  <congress_year>2025</congress_year>
  <vote_number>00001</vote_number>
  <vote_date>January 3, 2025, 12:00 PM</vote_date>
  <modify_date>2025-01-03 14:00:00</modify_date>
  <question>On the Motion</question>
  <vote_title>Motion to Proceed</vote_title>
  <vote_result>Motion Agreed to</vote_result>
  <vote_result_text>Motion Agreed to</vote_result_text>
  <count>
    <yeas>99</yeas>
    <nays>0</nays>
    <absent>1</absent>
  </count>
  <members>
    <member>
      <member_full>Baldwin (D-WI)</member_full>
      <last_name>Baldwin</last_name>
      <first_name>Tammy</first_name>
      <party>D</party>
      <state>WI</state>
      <vote_cast>Yea</vote_cast>
      <lis_member_id>S354</lis_member_id>
    </member>
    <member>
      <member_full>Cruz (R-TX)</member_full>
      <last_name>Cruz</last_name>
      <first_name>Ted</first_name>
      <party>R</party>
      <state>TX</state>
      <vote_cast>Nay</vote_cast>
      <lis_member_id>S355</lis_member_id>
    </member>
    <member>
      <member_full>Sanders (I-VT)</member_full>
      <last_name>Sanders</last_name>
      <first_name>Bernard</first_name>
      <party>I</party>
      <state>VT</state>
      <vote_cast>Not Voting</vote_cast>
      <lis_member_id>S313</lis_member_id>
    </member>
  </members>
  <document>
    <document_name>S.1</document_name>
    <document_title>Test Bill Title</document_title>
  </document>
</roll_call_vote>`;

const SAMPLE_VOTE_MENU_XML = `<?xml version="1.0" encoding="utf-8"?>
<vote_summary>
  <congress>119</congress>
  <session>1</session>
  <congress_year>2025</congress_year>
  <votes>
    <vote>
      <vote_number>00001</vote_number>
      <vote_date>January 3, 2025, 12:00 PM</vote_date>
      <issue>S. 1</issue>
      <question>On the Motion</question>
      <result>Agreed to</result>
      <vote_tally>
        <yeas>99</yeas>
        <nays>0</nays>
      </vote_tally>
      <title>Motion to Proceed</title>
    </vote>
    <vote>
      <vote_number>00002</vote_number>
      <vote_date>January 4, 2025, 10:30 AM</vote_date>
      <issue>H.R. 123</issue>
      <question>On Passage</question>
      <result>Passed</result>
      <vote_tally>
        <yeas>60</yeas>
        <nays>40</nays>
      </vote_tally>
      <title>Another Vote</title>
    </vote>
  </votes>
</vote_summary>`;

describe("parseSenateVoteXml", () => {
  it("parses complete vote data including metadata, counts, members, and document", () => {
    const result = parseSenateVoteXml(SAMPLE_VOTE_XML);

    expect(result.congress).toBe(119);
    expect(result.session).toBe(1);
    expect(result.voteNumber).toBe(1);
    expect(result.question).toBe("On the Motion");
    expect(result.result).toBe("Motion Agreed to");
    expect(result.voteDate).toContain("January 3, 2025");

    expect(result.yeas).toBe(99);
    expect(result.nays).toBe(0);
    expect(result.notVoting).toBe(1);

    expect(result.members).toHaveLength(3);
    const baldwin = result.members.find((m) => m.lastName === "Baldwin");
    expect(baldwin).toMatchObject({
      party: "D",
      state: "WI",
      voteCast: "Yea",
      lisMemberId: "S354",
    });

    expect(result.documentName).toBe("S.1");
    expect(result.documentTitle).toBe("Test Bill Title");
  });
});

describe("parseSenateVoteMenuXml", () => {
  it("parses vote menu metadata and list of votes", () => {
    const result = parseSenateVoteMenuXml(SAMPLE_VOTE_MENU_XML);

    expect(result.congress).toBe(119);
    expect(result.session).toBe(1);
    expect(result.votes).toHaveLength(2);

    expect(result.votes[0]).toMatchObject({
      voteNumber: 1,
      question: "On the Motion",
      result: "Agreed to",
      issue: "S. 1",
    });
  });
});

describe("SenateVoteClient", () => {
  let client: SenateVoteClient;

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    client = createSenateVoteClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getVoteMenu fetches and parses vote menu XML", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_VOTE_MENU_XML,
    });

    const result = await client.getVoteMenu(119, 1);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_1.xml",
      expect.any(Object)
    );
    expect(result.votes).toHaveLength(2);
  });

  it("getVote fetches and parses individual vote XML", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => SAMPLE_VOTE_XML,
    });

    const result = await client.getVote(119, 1, 1);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.xml",
      expect.any(Object)
    );
    expect(result.voteNumber).toBe(1);
    expect(result.members).toHaveLength(3);
  });

  it("getAllVotes fetches menu then all individual votes", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_VOTE_MENU_XML,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_VOTE_XML,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => SAMPLE_VOTE_XML,
      });

    const results = await client.getAllVotes(119, 1);

    expect(results).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws SenateApiError on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(client.getVoteMenu(999, 1)).rejects.toThrow(SenateApiError);
  });

  it("delays between requests when rate limiting is enabled", async () => {
    const clientWithRateLimit = createSenateVoteClient({ minDelayMs: 50 });

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_VOTE_MENU_XML,
    });

    const start = Date.now();
    await clientWithRateLimit.getVoteMenu(119, 1);
    await clientWithRateLimit.getVoteMenu(119, 1);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});

describe("SenateApiError", () => {
  it("creates error with message, status code, and name", () => {
    const error = new SenateApiError("Test error", 404);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("SenateApiError");
  });
});

describe("normalizeVotePosition", () => {
  it.each([
    ["Yea", "yea"],
    ["Aye", "yea"],
    ["Yes", "yea"],
    ["Nay", "nay"],
    ["No", "nay"],
    ["Present", "present"],
    ["Not Voting", "not_voting"],
    ["Absent", "not_voting"],
    ["", "not_voting"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeVotePosition(input)).toBe(expected);
  });
});

describe("buildSenateVoteUrl", () => {
  it.each([
    [
      119,
      1,
      1,
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.htm",
    ],
    [
      119,
      1,
      123,
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00123.htm",
    ],
    [
      118,
      2,
      45,
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1182/vote_118_2_00045.htm",
    ],
  ])("builds URL for congress %i, session %i, vote %i", (congress, session, vote, expected) => {
    expect(buildSenateVoteUrl(congress, session, vote)).toBe(expected);
  });
});
