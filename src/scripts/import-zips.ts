export interface ZctaCdRecord {
  zcta5: string;
  state: string;
  cd: string;
  arealandZcta: number;
  arealandPart: number;
}

export interface ZipDistrictRecord {
  zip: string;
  state: string;
  district: string;
  proportion: number;
}

export function parseZctaCdCsv(csvContent: string): ZctaCdRecord[] {
  const lines = csvContent.trim().split("\n");
  const records: ZctaCdRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 5) continue;

    records.push({
      zcta5: parts[0],
      state: parts[1],
      cd: parts[2],
      arealandZcta: parseInt(parts[3], 10),
      arealandPart: parseInt(parts[4], 10),
    });
  }

  return records;
}

export function calculateProportions(records: ZctaCdRecord[]): ZipDistrictRecord[] {
  const results: ZipDistrictRecord[] = [];

  for (const record of records) {
    let district = record.cd;
    if (district === "98" || district === "00") {
      district = "0";
    }

    const proportion = record.arealandZcta > 0 ? record.arealandPart / record.arealandZcta : 1.0;

    results.push({
      zip: record.zcta5,
      state: record.state,
      district,
      proportion,
    });
  }

  results.sort((a, b) => {
    if (a.zip !== b.zip) return a.zip.localeCompare(b.zip);
    return b.proportion - a.proportion;
  });

  return results;
}

const CENSUS_ZCTA_CD_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel2022/zcta520_cd118_natl.txt";

export async function fetchZctaCdData(): Promise<string> {
  const response = await fetch(CENSUS_ZCTA_CD_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ZCTA-CD data: ${response.statusText}`);
  }
  return response.text();
}

export async function importZipDistricts(): Promise<{
  total: number;
  inserted: number;
}> {
  const { neon } = await import("@neondatabase/serverless");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(databaseUrl);

  console.log("Fetching ZCTA-CD relationship data from Census Bureau...");
  const csvData = await fetchZctaCdData();

  console.log("Parsing CSV data...");
  const records = parseZctaCdCsv(csvData);
  console.log(`Found ${records.length} raw records`);

  console.log("Calculating proportions...");
  const zipDistricts = calculateProportions(records);
  console.log(`Calculated ${zipDistricts.length} ZIP-district mappings`);

  console.log("Clearing existing data...");
  await sql`DELETE FROM zip_districts`;

  console.log("Inserting ZIP-district mappings...");
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < zipDistricts.length; i += batchSize) {
    const batch = zipDistricts.slice(i, i + batchSize);

    for (const record of batch) {
      await sql`
        INSERT INTO zip_districts (zip, state, district, proportion)
        VALUES (${record.zip}, ${record.state}, ${record.district}, ${record.proportion})
        ON CONFLICT (zip, state, district) DO UPDATE SET
          proportion = EXCLUDED.proportion
      `;
      inserted++;
    }

    if ((i + batchSize) % 5000 === 0) {
      console.log(`Processed ${Math.min(i + batchSize, zipDistricts.length)} records...`);
    }
  }

  console.log(`Import complete: ${inserted} records inserted`);

  return { total: zipDistricts.length, inserted };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  importZipDistricts()
    .then((result) => {
      console.log("Import successful:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Import failed:", error);
      process.exit(1);
    });
}
