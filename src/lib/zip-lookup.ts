export interface DistrictEntry {
  d: string;
  p: number;
}

export interface ZipEntry {
  s: string;
  d: DistrictEntry[];
  lat?: number;
  lng?: number;
}

export type ZipData = Record<string, ZipEntry>;

export type ZipLookupResult =
  | { type: "single"; state: string; district: string }
  | {
      type: "ambiguous";
      options: Array<{ state: string; district: string; proportion: number }>;
      lat?: number;
      lng?: number;
    }
  | { type: "error"; message: string };

let cachedData: ZipData | null = null;

export async function getZipData(): Promise<ZipData> {
  if (cachedData) {
    return cachedData;
  }

  const manifestRes = await fetch("/data/zip-manifest.json");
  let dataUrl = "/data/zip-districts.json";
  if (manifestRes.ok) {
    const manifest = (await manifestRes.json()) as { file: string };
    dataUrl = `/data/${manifest.file}`;
  }

  const response = await fetch(dataUrl);
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
      message:
        "We don't have district data for this ZIP code. This may be a PO Box, military, or very new ZIP. You can find your representatives at congress.gov by searching your address.",
    };
  }

  const state = zipEntry.s;
  const sortedDistricts = [...zipEntry.d].sort((a, b) => b.p - a.p);

  if (sortedDistricts.length === 1) {
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
    ...(zipEntry.lat != null && zipEntry.lng != null && { lat: zipEntry.lat, lng: zipEntry.lng }),
  };
}
