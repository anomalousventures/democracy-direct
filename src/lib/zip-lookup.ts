export interface DistrictEntry {
  d: string;
  p: number;
}

export interface ZipEntry {
  s: string;
  d: DistrictEntry[];
}

export type ZipData = Record<string, ZipEntry>;

export type ZipLookupResult =
  | { type: "single"; state: string; district: string }
  | {
      type: "ambiguous";
      options: Array<{ state: string; district: string; proportion: number }>;
    }
  | { type: "error"; message: string };

let cachedData: ZipData | null = null;

export async function getZipData(): Promise<ZipData> {
  if (cachedData) {
    return cachedData;
  }

  const response = await fetch("/data/zip-districts.json");
  if (!response.ok) {
    throw new Error(`Failed to load ZIP data: ${response.statusText}`);
  }

  cachedData = await response.json();
  return cachedData as ZipData;
}

export function clearCache(): void {
  cachedData = null;
}

const ZIP_REGEX = /^\d{5}$/;
const UNAMBIGUOUS_THRESHOLD = 0.95;

export async function lookupZip(zip: string): Promise<ZipLookupResult> {
  const normalizedZip = zip.trim();

  if (!ZIP_REGEX.test(normalizedZip)) {
    return {
      type: "error",
      message: "Invalid ZIP code format. Please enter a 5-digit ZIP code.",
    };
  }

  const data = await getZipData();
  const zipEntry = data[normalizedZip];

  if (!zipEntry || !zipEntry.d || zipEntry.d.length === 0) {
    return {
      type: "error",
      message: "ZIP code not found. Please check the ZIP code and try again.",
    };
  }

  const state = zipEntry.s;
  const sortedDistricts = [...zipEntry.d].sort((a, b) => b.p - a.p);

  if (sortedDistricts[0].p >= UNAMBIGUOUS_THRESHOLD) {
    return {
      type: "single",
      state,
      district: sortedDistricts[0].d,
    };
  }

  return {
    type: "ambiguous",
    options: sortedDistricts.map((entry) => ({
      state,
      district: entry.d,
      proportion: entry.p,
    })),
  };
}
