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
  it("parses vote metadata", () => {
    const result = parseSenateVoteXml(SAMPLE_VOTE_XML);

    expect(result.congress).toBe(119);
    expect(result.session).toBe(1);
    expect(result.voteNumber).toBe(1);
    expect(result.question).toBe("On the Motion");
    expect(result.result).toBe("Motion Agreed to");
  });

  it("parses vote counts", () => {
    const result = parseSenateVoteXml(SAMPLE_VOTE_XML);

    expect(result.yeas).toBe(99);
    expect(result.nays).toBe(0);
    expect(result.notVoting).toBe(1);
  });

  it("parses member votes", () => {
    const result = parseSenateVoteXml(SAMPLE_VOTE_XML);

    expect(result.members).toHaveLength(3);

    const baldwin = result.members.find((m) => m.lastName === "Baldwin");
    expect(baldwin).toBeDefined();
    expect(baldwin?.party).toBe("D");
    expect(baldwin?.state).toBe("WI");
    expect(baldwin?.voteCast).toBe("Yea");
    expect(baldwin?.lisMemberId).toBe("S354");

    const sanders = result.members.find((m) => m.lastName === "Sanders");
    expect(sanders?.voteCast).toBe("Not Voting");
    expect(sanders?.party).toBe("I");
  });

  it("parses document/bill info when present", () => {
    const result = parseSenateVoteXml(SAMPLE_VOTE_XML);

    expect(result.documentName).toBe("S.1");
    expect(result.documentTitle).toBe("Test Bill Title");
  });

  it("parses date correctly", () => {
    const result = parseSenateVoteXml(SAMPLE_VOTE_XML);

    expect(result.voteDate).toContain("January 3, 2025");
  });
});

describe("parseSenateVoteMenuXml", () => {
  it("parses vote menu metadata", () => {
    const result = parseSenateVoteMenuXml(SAMPLE_VOTE_MENU_XML);

    expect(result.congress).toBe(119);
    expect(result.session).toBe(1);
  });

  it("parses list of votes", () => {
    const result = parseSenateVoteMenuXml(SAMPLE_VOTE_MENU_XML);

    expect(result.votes).toHaveLength(2);

    expect(result.votes[0].voteNumber).toBe(1);
    expect(result.votes[0].question).toBe("On the Motion");
    expect(result.votes[0].result).toBe("Agreed to");
    expect(result.votes[0].issue).toBe("S. 1");

    expect(result.votes[1].voteNumber).toBe(2);
    expect(result.votes[1].question).toBe("On Passage");
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

  describe("getVoteMenu", () => {
    it("fetches and parses vote menu XML", async () => {
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

    it("throws SenateApiError on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(client.getVoteMenu(999, 1)).rejects.toThrow(SenateApiError);
    });
  });

  describe("getVote", () => {
    it("fetches and parses individual vote XML", async () => {
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
  });

  describe("getAllVotes", () => {
    it("fetches menu then all individual votes", async () => {
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
  });

  describe("rate limiting", () => {
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
});

describe("SenateApiError", () => {
  it("creates error with message and status code", () => {
    const error = new SenateApiError("Test error", 404);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("SenateApiError");
  });
});

describe("normalizeVotePosition", () => {
  it("normalizes yea variants", () => {
    expect(normalizeVotePosition("Yea")).toBe("yea");
    expect(normalizeVotePosition("yea")).toBe("yea");
    expect(normalizeVotePosition("Aye")).toBe("yea");
    expect(normalizeVotePosition("Yes")).toBe("yea");
  });

  it("normalizes nay variants", () => {
    expect(normalizeVotePosition("Nay")).toBe("nay");
    expect(normalizeVotePosition("nay")).toBe("nay");
    expect(normalizeVotePosition("No")).toBe("nay");
  });

  it("normalizes present", () => {
    expect(normalizeVotePosition("Present")).toBe("present");
    expect(normalizeVotePosition("present")).toBe("present");
  });

  it("normalizes not voting and unknown values", () => {
    expect(normalizeVotePosition("Not Voting")).toBe("not_voting");
    expect(normalizeVotePosition("Absent")).toBe("not_voting");
    expect(normalizeVotePosition("")).toBe("not_voting");
  });
});

describe("buildSenateVoteUrl", () => {
  it("builds correct Senate.gov vote URLs", () => {
    expect(buildSenateVoteUrl(119, 1, 1)).toBe(
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.htm"
    );
    expect(buildSenateVoteUrl(119, 1, 123)).toBe(
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00123.htm"
    );
    expect(buildSenateVoteUrl(118, 2, 45)).toBe(
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1182/vote_118_2_00045.htm"
    );
  });
});
