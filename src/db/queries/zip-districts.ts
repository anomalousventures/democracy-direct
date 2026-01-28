import { eq, desc, and, or } from "drizzle-orm";
import type { Database } from "../client";
import { zipDistricts, legislators } from "../schema";

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

export async function getLegislatorsByStateAndDistrict(
  db: Database,
  state: string,
  district: string
) {
  return db
    .select()
    .from(legislators)
    .where(
      and(
        eq(legislators.state, state),
        or(
          eq(legislators.chamber, "senate"),
          and(eq(legislators.chamber, "house"), eq(legislators.district, district))
        )
      )
    );
}
