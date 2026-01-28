import "dotenv/config";

const STATE_FIPS_TO_ABBREV: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "78": "VI",
};

export interface ZipDistrictRecord {
  zip: string;
  state: string;
  district: string;
  proportion: number;
}

interface CensusRecord {
  stateFips: string;
  district: string;
  zcta: string;
  arealandZcta: number;
  arealandPart: number;
}

export function parseCensusFile(content: string): CensusRecord[] {
  const lines = content.trim().split("\n");
  const records: CensusRecord[] = [];
  let skipped = 0;

  if (lines.length === 0) {
    throw new Error("File content is empty");
  }

  const header = lines[0];
  if (!header.includes("GEOID_CD") || !header.includes("GEOID_ZCTA")) {
    console.warn("Warning: Header doesn't match expected Census format");
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split("|");
    if (parts.length < 17) {
      skipped++;
      continue;
    }

    const geoidCd = parts[1];
    const geoidZcta = parts[8];
    const arealandZcta = parseInt(parts[10], 10);
    const arealandPart = parseInt(parts[15], 10);

    if (!geoidCd || geoidCd.length < 4) {
      skipped++;
      continue;
    }
    if (!geoidZcta || !/^\d{5}$/.test(geoidZcta)) {
      skipped++;
      continue;
    }

    const stateFips = geoidCd.substring(0, 2);
    const district = geoidCd.substring(2);

    records.push({
      stateFips,
      district,
      zcta: geoidZcta,
      arealandZcta: isNaN(arealandZcta) ? 0 : arealandZcta,
      arealandPart: isNaN(arealandPart) ? 0 : arealandPart,
    });
  }

  if (skipped > 0) {
    console.log(`Skipped ${skipped} invalid records`);
  }

  return records;
}

export function calculateProportions(records: CensusRecord[]): ZipDistrictRecord[] {
  const results: ZipDistrictRecord[] = [];

  for (const record of records) {
    const stateAbbrev = STATE_FIPS_TO_ABBREV[record.stateFips];
    if (!stateAbbrev) {
      continue;
    }

    let district = record.district;
    if (district === "98" || district === "00" || district === "ZZ") {
      district = "0";
    }
    district = parseInt(district, 10).toString();

    const proportion = record.arealandZcta > 0 ? record.arealandPart / record.arealandZcta : 1.0;

    results.push({
      zip: record.zcta,
      state: stateAbbrev,
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

const CENSUS_CD119_ZCTA_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel2020/cd-sld/tab20_cd11920_zcta520_natl.txt";

export async function fetchZctaCdData(): Promise<string> {
  console.log(`Fetching from ${CENSUS_CD119_ZCTA_URL}...`);
  const response = await fetch(CENSUS_CD119_ZCTA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ZCTA-CD data: ${response.statusText}`);
  }
  return response.text();
}

export async function importZipDistricts(): Promise<{
  total: number;
  inserted: number;
}> {
  const { createDb } = await import("@/db/client");
  const { zipDistricts: zipDistrictsTable } = await import("@/db/schema");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const db = createDb(databaseUrl);

  console.log("Fetching ZCTA-CD relationship data from Census Bureau...");
  const csvData = await fetchZctaCdData();

  console.log("Parsing Census data...");
  const records = parseCensusFile(csvData);
  console.log(`Found ${records.length} raw records`);

  console.log("Calculating proportions...");
  const zipDistrictsData = calculateProportions(records);
  console.log(`Calculated ${zipDistrictsData.length} ZIP-district mappings`);

  console.log("Deleting existing data...");
  await db.delete(zipDistrictsTable);

  console.log("Inserting ZIP-district data...");
  const batchSize = 1000;
  let inserted = 0;

  for (let i = 0; i < zipDistrictsData.length; i += batchSize) {
    const batch = zipDistrictsData.slice(i, i + batchSize);

    await db.insert(zipDistrictsTable).values(
      batch.map((record) => ({
        zip: record.zip,
        state: record.state,
        district: record.district,
        proportion: record.proportion,
      }))
    );

    inserted += batch.length;
    console.log(`Inserted ${inserted} / ${zipDistrictsData.length} records...`);
  }

  console.log(`Import complete: ${inserted} records inserted`);
  return { total: zipDistrictsData.length, inserted };
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
