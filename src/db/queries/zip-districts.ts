import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { zipDistricts } from "../schema";

export interface ZipDistrictResult {
  state: string;
  district: string;
  proportion: number;
}

export async function getDistrictsByZip(db: Database, zip: string): Promise<ZipDistrictResult[]> {
  return db
    .select({
      state: zipDistricts.state,
      district: zipDistricts.district,
      proportion: zipDistricts.proportion,
    })
    .from(zipDistricts)
    .where(eq(zipDistricts.zip, zip))
    .orderBy(desc(zipDistricts.proportion))
    .limit(10);
}
