import { normalizeBillNumber } from "@/lib/bill-utils";

const BILL_PATTERN =
  /\b(?:H\.?\s*Con\.?\s*Res\.?\s*\d+|S\.?\s*Con\.?\s*Res\.?\s*\d+|H\.?\s*J\.?\s*Res\.?\s*\d+|S\.?\s*J\.?\s*Res\.?\s*\d+|H\.?\s*Res\.?\s*\d+|S\.?\s*Res\.?\s*\d+|H\.?\s*R\.?\s*\d+|S\.?\s*\d+)\b/gi;

export function detectBillNumbers(text: string): string[] {
  const matches = text.match(BILL_PATTERN);
  if (!matches) return [];

  const normalized = new Set<string>();
  for (const match of matches) {
    const result = normalizeBillNumber(match);
    if (result) {
      normalized.add(result);
    }
  }

  return [...normalized].sort();
}
