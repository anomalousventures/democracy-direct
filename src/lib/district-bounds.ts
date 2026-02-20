import { STATE_TO_FIPS } from "./tigerweb";

type BoundsData = Record<string, [number, number, number, number]>;

let cachedBounds: BoundsData | null = null;

export function resetBoundsCache(): void {
  cachedBounds = null;
}

export async function getDistrictBounds(
  state: string,
  district: string
): Promise<[number, number, number, number] | null> {
  if (!cachedBounds) {
    const res = await fetch("/data/district-bounds.json");
    if (!res.ok) return null;
    cachedBounds = await res.json();
  }

  const fips = STATE_TO_FIPS[state];
  if (!fips) return null;

  const geoid00 = `${fips}${district.padStart(2, "0")}`;
  if (district === "0") {
    return cachedBounds?.[`${fips}98`] ?? cachedBounds?.[geoid00] ?? null;
  }
  return cachedBounds?.[geoid00] ?? null;
}
