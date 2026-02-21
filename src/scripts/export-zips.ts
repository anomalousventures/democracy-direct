import "dotenv/config";
import { writeFile, mkdir } from "fs/promises";
import { createHash } from "crypto";
import { dirname, join } from "path";
import { desc } from "drizzle-orm";
import { createDb } from "../db/client";
import { zipDistricts } from "../db/schema";

export interface ZipDistrictDb {
  zip: string;
  state: string;
  district: string;
  proportion: number;
}

export interface ClientDistrictEntry {
  d: string;
  p: number;
}

export interface ClientZipEntry {
  s: string;
  d: ClientDistrictEntry[];
  lat?: number;
  lng?: number;
}

export type ClientZipData = Record<string, ClientZipEntry>;

export function transformToClientFormat(
  records: ZipDistrictDb[],
  centroids?: Map<string, { lat: number; lng: number }>
): ClientZipData {
  const grouped = new Map<string, ZipDistrictDb[]>();

  for (const record of records) {
    const existing = grouped.get(record.zip) || [];
    existing.push(record);
    grouped.set(record.zip, existing);
  }

  const result: ClientZipData = {};

  for (const [zip, zipRecords] of grouped) {
    zipRecords.sort((a, b) => b.proportion - a.proportion);

    const centroid = centroids?.get(zip);
    result[zip] = {
      s: zipRecords[0].state,
      d: zipRecords.map((r) => ({
        d: r.district,
        p: Math.round(r.proportion * 10000) / 10000,
      })),
      ...(centroid && { lat: centroid.lat, lng: centroid.lng }),
    };
  }

  return result;
}

const HUD_CENTROIDS_URL =
  "https://opendata.arcgis.com/api/v3/datasets/d032efff520b4bf0aa620a54a477c70e_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1";

interface HudFeature {
  properties: {
    STD_ZIP5: string;
    LATITUDE: number | null;
    LONGITUDE: number | null;
  };
}

export async function fetchZipCentroids(): Promise<Map<string, { lat: number; lng: number }>> {
  try {
    console.log("Fetching ZIP centroid data from HUD...");
    const res = await fetch(HUD_CENTROIDS_URL);
    if (!res.ok) {
      console.warn(`Failed to fetch centroids: ${res.statusText}. Proceeding without.`);
      return new Map();
    }

    const geojson = (await res.json()) as { features: HudFeature[] };
    const centroids = new Map<string, { lat: number; lng: number }>();

    for (const feature of geojson.features) {
      const zip = feature.properties.STD_ZIP5;
      const lat = feature.properties.LATITUDE;
      const lng = feature.properties.LONGITUDE;
      if (zip && lat != null && lng != null) {
        centroids.set(zip, {
          lat: Math.round(lat * 1000) / 1000,
          lng: Math.round(lng * 1000) / 1000,
        });
      }
    }

    console.log(`Loaded ${centroids.size} ZIP centroids`);
    return centroids;
  } catch (err) {
    console.warn(
      `Failed to fetch centroids: ${err instanceof Error ? err.message : err}. Proceeding without.`
    );
    return new Map();
  }
}

export async function exportZipData(outputPath: string): Promise<{
  zipCount: number;
  fileSize: number;
}> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const db = createDb(databaseUrl);

  console.log("Fetching ZIP-district data from database...");
  const rawRecords = await db
    .select({
      zip: zipDistricts.zip,
      state: zipDistricts.state,
      district: zipDistricts.district,
      proportion: zipDistricts.proportion,
    })
    .from(zipDistricts)
    .orderBy(zipDistricts.zip, desc(zipDistricts.proportion));

  const records: ZipDistrictDb[] = rawRecords;

  console.log(`Found ${records.length} records`);

  const centroids = await fetchZipCentroids();

  console.log("Transforming to client format...");
  const clientData = transformToClientFormat(records, centroids);
  const zipCount = Object.keys(clientData).length;

  console.log(`Transformed ${zipCount} unique ZIP codes`);

  const jsonContent = JSON.stringify(clientData);
  const fileSize = Buffer.byteLength(jsonContent, "utf-8");

  await mkdir(dirname(outputPath), { recursive: true });

  const hash = createHash("md5").update(jsonContent).digest("hex").slice(0, 8);
  const hashedFilename = `zip-districts-${hash}.json`;
  const hashedPath = join(dirname(outputPath), hashedFilename);

  await writeFile(hashedPath, jsonContent, "utf-8");
  console.log(`Wrote ${(fileSize / 1024 / 1024).toFixed(2)} MB to ${hashedPath}`);

  const manifestPath = join(dirname(outputPath), "zip-manifest.json");
  await writeFile(manifestPath, JSON.stringify({ file: hashedFilename }), "utf-8");
  console.log(`Wrote manifest to ${manifestPath}`);

  await writeFile(outputPath, jsonContent, "utf-8");

  return { zipCount, fileSize };
}

const DEFAULT_OUTPUT_PATH = "public/data/zip-districts.json";

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputPath = process.argv[2] || DEFAULT_OUTPUT_PATH;

  exportZipData(outputPath)
    .then((result) => {
      console.log("Export successful:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Export failed:", error);
      process.exit(1);
    });
}
