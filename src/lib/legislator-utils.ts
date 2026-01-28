const PARTY_CONFIG: Record<string, { color: string; short: string; full: string }> = {
  Democrat: { color: "bg-blue-600", short: "D", full: "Democrat" },
  Republican: { color: "bg-red-600", short: "R", full: "Republican" },
};

const DEFAULT_PARTY = { color: "bg-gray-600", short: "I", full: "Independent" };

export function getPhotoUrl(bioguideId: string): string {
  if (!bioguideId || bioguideId.length === 0) {
    return "";
  }
  return `https://bioguide.congress.gov/bioguide/photo/${bioguideId[0]}/${bioguideId}.jpg`;
}

export function getPartyColor(party: string): string {
  return PARTY_CONFIG[party]?.color ?? DEFAULT_PARTY.color;
}

export function getPartyLabel(party: string, short = false): string {
  const config = PARTY_CONFIG[party] ?? DEFAULT_PARTY;
  return short ? config.short : config.full;
}

function getOrdinalSuffix(n: number): string {
  const tensDigit = Math.floor((n % 100) / 10);
  if (tensDigit === 1) {
    return "th";
  }

  const onesDigit = n % 10;
  switch (onesDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function getRepTitle(
  chamber: string,
  state: string,
  district: string | null,
  format: "short" | "full" = "full"
): string {
  const isShort = format === "short";

  if (chamber === "senate") {
    return isShort ? `Senator from ${state}` : `U.S. Senator from ${state}`;
  }

  if (district === "0") {
    return isShort
      ? `Representative At-Large from ${state}`
      : `U.S. Representative At-Large from ${state}`;
  }

  const districtNum = parseInt(district || "0", 10);
  if (isShort) {
    return `Representative from ${state} District ${district}`;
  }
  return `U.S. Representative from ${state}'s ${districtNum}${getOrdinalSuffix(districtNum)} Congressional District`;
}

export function formatDate(dateStr: string | null): string | null {
  if (!dateStr) {
    return null;
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
