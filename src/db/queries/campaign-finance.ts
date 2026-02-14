import { eq, desc } from "drizzle-orm";
import type { Database } from "../client";
import { campaignFinance } from "../schema";

export async function getFinanceByMember(db: Database, bioguideId: string) {
  return (
    (await db.query.campaignFinance.findFirst({
      where: eq(campaignFinance.bioguideId, bioguideId),
      orderBy: desc(campaignFinance.cycle),
    })) ?? null
  );
}

export type CampaignFinanceData = NonNullable<Awaited<ReturnType<typeof getFinanceByMember>>>;
