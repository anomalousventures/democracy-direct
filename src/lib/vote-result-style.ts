export type VoteResultVariant = "badge" | "detail";

const RESULT_STYLES = {
  passed: {
    badge: "bg-green-50 text-green-700",
    detail: "bg-green-100 text-green-800 border-green-200",
  },
  failed: {
    badge: "bg-red-50 text-red-700",
    detail: "bg-red-100 text-red-800 border-red-200",
  },
  neutral: {
    badge: "bg-gray-50 text-gray-600",
    detail: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export function getVoteResultStyle(result: string, variant: VoteResultVariant = "badge"): string {
  const lower = result.toLowerCase();
  if (lower.includes("passed") || lower.includes("agreed")) return RESULT_STYLES.passed[variant];
  if (lower.includes("failed") || lower.includes("rejected")) return RESULT_STYLES.failed[variant];
  return RESULT_STYLES.neutral[variant];
}
