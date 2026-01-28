export const getPhotoUrl = (bioguideId: string) =>
  `https://bioguide.congress.gov/bioguide/photo/${bioguideId[0]}/${bioguideId}.jpg`;

export const getPartyColor = (party: string) => {
  switch (party) {
    case "Democrat":
      return "bg-blue-600";
    case "Republican":
      return "bg-red-600";
    default:
      return "bg-gray-600";
  }
};

export const getPartyLabel = (party: string, short = false) => {
  if (short) {
    switch (party) {
      case "Democrat":
        return "D";
      case "Republican":
        return "R";
      default:
        return "I";
    }
  }
  switch (party) {
    case "Democrat":
      return "Democrat";
    case "Republican":
      return "Republican";
    default:
      return "Independent";
  }
};

const getOrdinalSuffix = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

export const getRepTitle = (
  chamber: string,
  state: string,
  district: string | null,
  format: "short" | "full" = "full"
) => {
  if (chamber === "senate") {
    return format === "short" ? `Senator from ${state}` : `U.S. Senator from ${state}`;
  }
  if (district === "0") {
    return format === "short"
      ? `Representative At-Large from ${state}`
      : `U.S. Representative At-Large from ${state}`;
  }
  const districtNum = parseInt(district || "0");
  return format === "short"
    ? `Representative from ${state} District ${district}`
    : `U.S. Representative from ${state}'s ${district}${getOrdinalSuffix(districtNum)} Congressional District`;
};

export const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
