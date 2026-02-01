/**
 * Utilities for parsing and normalizing bill numbers.
 * Handles various input formats and converts to standard format.
 */

import type { BillType, ParsedBillNumber } from "@/lib/types/legislation";

export const BILL_TYPE_DISPLAY_NAMES: Record<BillType, string> = {
  hr: "H.R.",
  s: "S.",
  hjres: "H.J.Res.",
  sjres: "S.J.Res.",
  hconres: "H.Con.Res.",
  sconres: "S.Con.Res.",
  hres: "H.Res.",
  sres: "S.Res.",
};

const BILL_TYPES: BillType[] = ["hconres", "sconres", "hjres", "sjres", "hres", "sres", "hr", "s"];

const BILL_TYPE_PATTERNS: Record<BillType, RegExp> = {
  hr: /^h\.?\s*r\.?\s*(\d+)$/i,
  s: /^s\.?\s*(\d+)$/i,
  hjres: /^h\.?\s*j\.?\s*res\.?\s*(\d+)$/i,
  sjres: /^s\.?\s*j\.?\s*res\.?\s*(\d+)$/i,
  hconres: /^h\.?\s*con\.?\s*res\.?\s*(\d+)$/i,
  sconres: /^s\.?\s*con\.?\s*res\.?\s*(\d+)$/i,
  hres: /^h\.?\s*res\.?\s*(\d+)$/i,
  sres: /^s\.?\s*res\.?\s*(\d+)$/i,
};

export function isValidBillType(type: string): type is BillType {
  return BILL_TYPES.includes(type as BillType);
}

/**
 * Normalizes a bill number to standard format (e.g., "H.R.1234", "S.567").
 * Handles various input formats like "HR1234", "H.R. 1234", "hr 1234".
 * @returns Normalized bill number or null if invalid
 */
export function normalizeBillNumber(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const billType of BILL_TYPES) {
    const pattern = BILL_TYPE_PATTERNS[billType];
    const match = trimmed.match(pattern);
    if (match) {
      const number = parseInt(match[1], 10);
      return `${BILL_TYPE_DISPLAY_NAMES[billType]}${number}`;
    }
  }

  return null;
}

/**
 * Parses a bill number string into its components.
 * @returns Parsed bill data or null if invalid
 */
export function parseBillNumber(input: string): ParsedBillNumber | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const billType of BILL_TYPES) {
    const pattern = BILL_TYPE_PATTERNS[billType];
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type: billType,
        number: parseInt(match[1], 10),
      };
    }
  }

  return null;
}

/**
 * Parses a URL-friendly bill ID (e.g., "hr1234", "hr1234-119") into components.
 * @returns Parsed bill data or null if invalid
 */
export function parseBillId(billId: string): (ParsedBillNumber & { congress?: number }) | null {
  const trimmed = billId.trim().toLowerCase();
  if (!trimmed) return null;

  const congressMatch = trimmed.match(/^(.+)-(\d+)$/);
  let baseId = trimmed;
  let congress: number | undefined;

  if (congressMatch) {
    baseId = congressMatch[1];
    congress = parseInt(congressMatch[2], 10);
  }

  for (const billType of BILL_TYPES) {
    const pattern = new RegExp(`^${billType}(\\d+)$`, "i");
    const match = baseId.match(pattern);
    if (match) {
      return {
        type: billType,
        number: parseInt(match[1], 10),
        ...(congress !== undefined && { congress }),
      };
    }
  }

  return null;
}

/**
 * Converts parsed bill data to a URL-friendly ID.
 * @example toBillId({ type: "hr", number: 1234 }) => "hr1234"
 * @example toBillId({ type: "hr", number: 1234, congress: 119 }) => "hr1234-119"
 */
export function toBillId(parsed: ParsedBillNumber): string {
  const base = `${parsed.type}${parsed.number}`;
  if (parsed.congress !== undefined) {
    return `${base}-${parsed.congress}`;
  }
  return base;
}

/**
 * Converts a URL-friendly bill ID to display format.
 * @example billIdToDisplay("hr1234") => "H.R.1234"
 */
export function billIdToDisplay(billId: string): string | null {
  const parsed = parseBillId(billId);
  if (!parsed) return null;
  return `${BILL_TYPE_DISPLAY_NAMES[parsed.type]}${parsed.number}`;
}

/**
 * Gets the chamber for a bill type.
 */
export function getBillChamber(billType: BillType): "house" | "senate" {
  const houseBills: BillType[] = ["hr", "hjres", "hconres", "hres"];
  return houseBills.includes(billType) ? "house" : "senate";
}

/**
 * Builds a Congress.gov URL for a bill.
 */
export function buildCongressGovUrl(
  congress: number,
  billType: BillType,
  billNumber: number
): string {
  const typeMap: Record<BillType, string> = {
    hr: "house-bill",
    s: "senate-bill",
    hjres: "house-joint-resolution",
    sjres: "senate-joint-resolution",
    hconres: "house-concurrent-resolution",
    sconres: "senate-concurrent-resolution",
    hres: "house-resolution",
    sres: "senate-resolution",
  };
  return `https://www.congress.gov/bill/${congress}th-congress/${typeMap[billType]}/${billNumber}`;
}
