/**
 * Senate.gov XML parser for Senate voting records.
 * Parses vote menu and individual vote XML files.
 */

import { XMLParser } from "fast-xml-parser";

const SENATE_BASE_URL = "https://www.senate.gov/legislative/LIS";

export class SenateApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "SenateApiError";
  }
}

export interface SenateVoteMember {
  memberFull: string;
  lastName: string;
  firstName?: string;
  party: string;
  state: string;
  voteCast: string;
  lisMemberId: string;
}

export interface ParsedSenateVote {
  congress: number;
  session: number;
  voteNumber: number;
  voteDate: string;
  question: string;
  result: string;
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
  members: SenateVoteMember[];
  documentName?: string;
  documentTitle?: string;
}

export interface ParsedVoteMenuItem {
  voteNumber: number;
  voteDate: string;
  issue?: string;
  question: string;
  result: string;
  yeas?: number;
  nays?: number;
}

export interface ParsedVoteMenu {
  congress: number;
  session: number;
  votes: ParsedVoteMenuItem[];
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) => name === "vote" || name === "member",
});

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseVoteNumber(voteNum: string | number): number {
  if (typeof voteNum === "number") return voteNum;
  return parseInt(voteNum.replace(/^0+/, "") || "0", 10);
}

/**
 * Parses Senate vote XML into structured data.
 */
export function parseSenateVoteXml(xml: string): ParsedSenateVote {
  const parsed = xmlParser.parse(xml);
  const vote = parsed.roll_call_vote;

  if (!vote) {
    throw new SenateApiError("Invalid Senate vote XML: missing roll_call_vote");
  }

  const count = vote.count || {};
  const members = ensureArray(vote.members?.member || []);

  const parsedMembers: SenateVoteMember[] = members.map((m: Record<string, unknown>) => ({
    memberFull: String(m.member_full || ""),
    lastName: String(m.last_name || ""),
    firstName: m.first_name ? String(m.first_name) : undefined,
    party: String(m.party || ""),
    state: String(m.state || ""),
    voteCast: String(m.vote_cast || ""),
    lisMemberId: String(m.lis_member_id || ""),
  }));

  const notVotingCount =
    parsedMembers.filter((m) => m.voteCast === "Not Voting").length ||
    parseInt(String(count.absent || 0), 10);

  const presentCount = parsedMembers.filter((m) => m.voteCast === "Present").length;

  return {
    congress: parseInt(String(vote.congress), 10),
    session: parseInt(String(vote.session), 10),
    voteNumber: parseVoteNumber(vote.vote_number),
    voteDate: String(vote.vote_date || ""),
    question: String(vote.question || ""),
    result: String(vote.vote_result || vote.vote_result_text || ""),
    yeas: parseInt(String(count.yeas || 0), 10),
    nays: parseInt(String(count.nays || 0), 10),
    notVoting: notVotingCount,
    present: presentCount,
    members: parsedMembers,
    documentName: vote.document?.document_name ? String(vote.document.document_name) : undefined,
    documentTitle: vote.document?.document_title ? String(vote.document.document_title) : undefined,
  };
}

/**
 * Parses Senate vote menu XML (list of votes) into structured data.
 */
export function parseSenateVoteMenuXml(xml: string): ParsedVoteMenu {
  const parsed = xmlParser.parse(xml);
  const menu = parsed.vote_summary;

  if (!menu) {
    throw new SenateApiError("Invalid Senate vote menu XML: missing vote_summary");
  }

  const votes = ensureArray(menu.votes?.vote || []);

  return {
    congress: parseInt(String(menu.congress), 10),
    session: parseInt(String(menu.session), 10),
    votes: votes.map((v: Record<string, unknown>) => ({
      voteNumber: parseVoteNumber(v.vote_number as string | number),
      voteDate: String(v.vote_date || ""),
      issue: v.issue ? String(v.issue) : undefined,
      question: String(v.question || ""),
      result: String(v.result || ""),
      yeas: v.vote_tally
        ? parseInt(String((v.vote_tally as Record<string, unknown>).yeas || 0), 10)
        : undefined,
      nays: v.vote_tally
        ? parseInt(String((v.vote_tally as Record<string, unknown>).nays || 0), 10)
        : undefined,
    })),
  };
}

export interface SenateClientOptions {
  minDelayMs?: number;
}

export interface SenateVoteClient {
  getVoteMenu(congress: number, session: number): Promise<ParsedVoteMenu>;
  getVote(congress: number, session: number, voteNumber: number): Promise<ParsedSenateVote>;
  getAllVotes(congress: number, session: number): Promise<ParsedSenateVote[]>;
}

export function createSenateVoteClient(options: SenateClientOptions = {}): SenateVoteClient {
  const { minDelayMs = 0 } = options;
  let lastRequestTime = 0;

  async function rateLimitedFetch(url: string): Promise<Response> {
    if (minDelayMs > 0) {
      const now = Date.now();
      const elapsed = now - lastRequestTime;
      if (elapsed < minDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
      }
    }
    lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/xml, text/xml",
        },
      });

      if (!response.ok) {
        throw new SenateApiError(
          `Senate.gov error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error instanceof SenateApiError) {
        throw error;
      }
      throw new SenateApiError(
        `Senate.gov request failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  function formatVoteNumber(num: number): string {
    return num.toString().padStart(5, "0");
  }

  return {
    async getVoteMenu(congress: number, session: number): Promise<ParsedVoteMenu> {
      const url = `${SENATE_BASE_URL}/roll_call_lists/vote_menu_${congress}_${session}.xml`;
      const response = await rateLimitedFetch(url);
      const xml = await response.text();
      return parseSenateVoteMenuXml(xml);
    },

    async getVote(
      congress: number,
      session: number,
      voteNumber: number
    ): Promise<ParsedSenateVote> {
      const voteNumPadded = formatVoteNumber(voteNumber);
      const url = `${SENATE_BASE_URL}/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${voteNumPadded}.xml`;
      const response = await rateLimitedFetch(url);
      const xml = await response.text();
      return parseSenateVoteXml(xml);
    },

    async getAllVotes(congress: number, session: number): Promise<ParsedSenateVote[]> {
      const menu = await this.getVoteMenu(congress, session);
      const votes: ParsedSenateVote[] = [];

      for (const item of menu.votes) {
        const vote = await this.getVote(congress, session, item.voteNumber);
        votes.push(vote);
      }

      return votes;
    },
  };
}

/**
 * Normalizes Senate vote position strings to standard format.
 */
export function normalizeVotePosition(position: string): "yea" | "nay" | "not_voting" | "present" {
  const normalized = position.toLowerCase().trim();
  if (normalized === "yea" || normalized === "aye" || normalized === "yes") {
    return "yea";
  }
  if (normalized === "nay" || normalized === "no") {
    return "nay";
  }
  if (normalized === "present") {
    return "present";
  }
  return "not_voting";
}

/**
 * Builds a Senate.gov URL for a specific vote.
 */
export function buildSenateVoteUrl(congress: number, session: number, voteNumber: number): string {
  const paddedVote = voteNumber.toString().padStart(5, "0");
  return `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${paddedVote}.htm`;
}
