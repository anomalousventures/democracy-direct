import type { AmendmentType } from "@/lib/types/legislation";

export interface ParsedAmendmentRef {
  type: AmendmentType;
  number: number;
}

const AMENDMENT_PATTERN = /^([HS])\.?\s*AMDT\.?\s*(\d+)$/i;
const AMENDMENT_IN_QUESTION_PATTERN =
  /(?:On the Amendment|Amendment)\s+([HS])\.?\s*AMDT\.?\s*(\d+)/i;
const AMENDMENT_URL_PATTERN = /congress\.gov\/amendment\/\d+\/(house|senate)-amendment\/(\d+)/i;

export function parseAmendmentNumber(input: string): ParsedAmendmentRef | null {
  const match = input.trim().match(AMENDMENT_PATTERN);
  if (!match) return null;

  const chamber = match[1].toUpperCase();
  const number = parseInt(match[2], 10);

  if (isNaN(number)) return null;

  return {
    type: chamber === "H" ? "hamdt" : "samdt",
    number,
  };
}

export function parseAmendmentFromUrl(url: string): ParsedAmendmentRef | null {
  const match = url.match(AMENDMENT_URL_PATTERN);
  if (!match) return null;

  const chamber = match[1].toLowerCase();
  const number = parseInt(match[2], 10);

  if (isNaN(number)) return null;

  return {
    type: chamber === "house" ? "hamdt" : "samdt",
    number,
  };
}

export function detectAmendmentFromVote(
  question: string,
  billNumber: string | null,
  legislationType: string | null,
  legislationUrl?: string | null
): ParsedAmendmentRef | null {
  if (legislationUrl) {
    const parsed = parseAmendmentFromUrl(legislationUrl);
    if (parsed) return parsed;
  }

  if (billNumber) {
    const parsed = parseAmendmentNumber(billNumber);
    if (parsed) return parsed;
  }

  const questionMatch = question.match(AMENDMENT_IN_QUESTION_PATTERN);
  if (questionMatch) {
    const chamber = questionMatch[1].toUpperCase();
    const number = parseInt(questionMatch[2], 10);

    if (!isNaN(number)) {
      return {
        type: chamber === "H" ? "hamdt" : "samdt",
        number,
      };
    }
  }

  return null;
}

export function getAmendmentPageUrl(
  amendmentType: AmendmentType,
  amendmentNumber: string,
  congress: number
): string {
  return `/legislation/amendment/${amendmentType}${amendmentNumber}-${congress}`;
}

export function parseAmendmentId(
  id: string
): { type: AmendmentType; number: string; congress: number } | null {
  const match = id.match(/^(hamdt|samdt)(\d+)-(\d+)$/i);
  if (!match) return null;

  const type = match[1].toLowerCase() as AmendmentType;
  const number = match[2];
  const congress = parseInt(match[3], 10);

  if (isNaN(congress) || congress < 1) return null;

  return { type, number, congress };
}

export function buildAmendmentCongressGovUrl(
  congress: number,
  amendmentType: AmendmentType,
  amendmentNumber: number
): string {
  return `https://www.congress.gov/amendment/${congress}th-congress/${amendmentType === "hamdt" ? "house" : "senate"}-amendment/${amendmentNumber}`;
}
