import type { BillSummariesResponse } from "@/lib/types/legislation";

/**
 * Version codes from bill-status user guide:
 * https://github.com/usgpo/bill-status/blob/master/BILLSTATUS-XML_User_User-Guide.md
 *
 * Lower priority number = more advanced legislative stage.
 */
const VERSION_CODE_PRIORITY: Record<string, number> = {
  "36": 1, // Passed Congress
  "28": 2, // Enrolled Bill
  "35": 3, // Passed Senate
  "29": 4, // Passed House
  "49": 5, // Public Law
  "25": 6, // Engrossed Amendment Senate
  "17": 7, // Engrossed Amendment House
  "00": 8, // Introduced in House
  "01": 8, // Introduced in Senate
};

type SummaryItem = BillSummariesResponse["summaries"][number];

export function selectBestSummary(summaries: SummaryItem[]): string | null {
  if (summaries.length === 0) return null;

  const sorted = [...summaries].sort((a, b) => {
    const priorityA = VERSION_CODE_PRIORITY[a.versionCode] ?? 99;
    const priorityB = VERSION_CODE_PRIORITY[b.versionCode] ?? 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime();
  });

  return stripHtmlTags(sorted[0].text);
}

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
