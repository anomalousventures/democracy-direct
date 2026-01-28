import { and, eq, or } from "drizzle-orm";
import type { Database } from "../client";
import { legislators, type Legislator } from "../schema";

export async function getLegislatorByBioguideId(
  db: Database,
  bioguideId: string
): Promise<Legislator | null> {
  const results = await db
    .select()
    .from(legislators)
    .where(eq(legislators.bioguideId, bioguideId))
    .limit(1);

  return results[0] ?? null;
}

export async function getLegislatorsByStateAndDistrict(
  db: Database,
  state: string,
  district: string
): Promise<Legislator[]> {
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
