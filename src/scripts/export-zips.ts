import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

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
}

export type ClientZipData = Record<string, ClientZipEntry>;

export function transformToClientFormat(records: ZipDistrictDb[]): ClientZipData {
  const grouped = new Map<string, ZipDistrictDb[]>();

  for (const record of records) {
    const existing = grouped.get(record.zip) || [];
    existing.push(record);
    grouped.set(record.zip, existing);
  }

  const result: ClientZipData = {};

  for (const [zip, zipRecords] of grouped) {
    zipRecords.sort((a, b) => b.proportion - a.proportion);

    result[zip] = {
      s: zipRecords[0].state,
      d: zipRecords.map((r) => ({
        d: r.district,
        p: Math.round(r.proportion * 10000) / 10000,
      })),
    };
  }

  return result;
}

export async function exportZipData(outputPath: string): Promise<{
  zipCount: number;
  fileSize: number;
}> {
  const { neon } = await import("@neondatabase/serverless");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(databaseUrl);

  console.log("Fetching ZIP-district data from database...");
  const rawRecords = await sql`
    SELECT zip, state, district, proportion
    FROM zip_districts
    ORDER BY zip, proportion DESC
  `;

  const records: ZipDistrictDb[] = rawRecords.map((r) => ({
    zip: r.zip as string,
    state: r.state as string,
    district: r.district as string,
    proportion: r.proportion as number,
  }));

  console.log(`Found ${records.length} records`);

  console.log("Transforming to client format...");
  const clientData = transformToClientFormat(records);
  const zipCount = Object.keys(clientData).length;

  console.log(`Transformed ${zipCount} unique ZIP codes`);

  const jsonContent = JSON.stringify(clientData);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, jsonContent, "utf-8");

  const fileSize = Buffer.byteLength(jsonContent, "utf-8");
  console.log(`Wrote ${(fileSize / 1024 / 1024).toFixed(2)} MB to ${outputPath}`);

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
