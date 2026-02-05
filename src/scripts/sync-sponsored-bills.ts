import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { createCongressClient, getCurrentCongress, type CongressClient } from "@/lib/congress-api";
import { buildCongressGovUrl } from "@/lib/bill-utils";
import type { Database } from "@/db/client";
import type { BillType, BillStatus } from "@/lib/types/legislation";

export interface SyncSponsoredBillsResult {
  source: "congress.gov";
  changed: boolean;
  legislatorsProcessed: number;
  billsUpserted: number;
  duration: string;
  errors: Array<{ bioguideId: string; error: string }>;
}

const BILL_TYPE_MAP: Record<string, BillType> = {
  HR: "hr",
  S: "s",
  HJRES: "hjres",
  SJRES: "sjres",
  HCONRES: "hconres",
  SCONRES: "sconres",
  HRES: "hres",
  SRES: "sres",
};

function inferBillStatus(latestActionText: string): BillStatus {
  const lowerText = latestActionText.toLowerCase();
  if (lowerText.includes("became public law") || lowerText.includes("became law")) {
    return "became_law";
  }
  if (lowerText.includes("signed by president")) return "signed";
  if (lowerText.includes("vetoed")) return "vetoed";
  if (lowerText.includes("presented to president")) return "to_president";
  if (lowerText.includes("passed house") && lowerText.includes("passed senate")) {
    return "resolving_differences";
  }
  if (lowerText.includes("passed senate")) return "passed_senate";
  if (lowerText.includes("passed house")) return "passed_house";
  return "introduced";
}

async function syncLegislatorBills(
  db: Database,
  client: CongressClient,
  bioguideId: string,
  congress: number
): Promise<number> {
  const { bills } = await import("@/db/schema");

  let offset = 0;
  const limit = 250;
  let totalUpserted = 0;

  while (true) {
    const response = await client.getSponsoredBills(bioguideId, { limit, offset });

    for (const bill of response.bills) {
      if (bill.congress !== congress) continue;

      if (!bill.type || !bill.number || !bill.title || Number.isNaN(bill.number)) {
        continue;
      }

      const billType = BILL_TYPE_MAP[bill.type.toUpperCase()];
      if (!billType) continue;

      const existing = await db
        .select({ id: bills.id })
        .from(bills)
        .where(
          and(
            eq(bills.congress, bill.congress),
            eq(bills.billType, billType),
            eq(bills.billNumber, bill.number.toString())
          )
        )
        .limit(1);

      if (existing[0]) {
        continue;
      }

      const latestActionText = bill.latestAction?.text ?? "Introduced";

      await db
        .insert(bills)
        .values({
          billNumber: bill.number.toString(),
          billType,
          congress: bill.congress,
          title: bill.title,
          summary: null,
          status: inferBillStatus(latestActionText),
          subjects: bill.policyArea?.name ? [bill.policyArea.name] : [],
          introducedDate: bill.introducedDate ? new Date(bill.introducedDate) : new Date(),
          latestActionDate: bill.latestAction?.actionDate
            ? new Date(bill.latestAction.actionDate)
            : new Date(),
          latestActionText,
          sponsorBioguideId: bill.sponsors?.[0]?.bioguideId ?? bioguideId,
          congressGovUrl: buildCongressGovUrl(bill.congress, billType, bill.number),
        })
        .onConflictDoNothing();

      totalUpserted++;
    }

    if (!response.pagination?.next || response.bills.length < limit) {
      break;
    }
    offset += limit;
  }

  return totalUpserted;
}

export async function syncSponsoredBills(
  congressNumber?: number
): Promise<SyncSponsoredBillsResult> {
  const startTime = Date.now();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const congressApiKey = process.env.CONGRESS_API_KEY;
  if (!congressApiKey) {
    throw new Error("CONGRESS_API_KEY environment variable is required");
  }

  const { createDb } = await import("@/db/client");
  const { legislators } = await import("@/db/schema");

  const db = createDb(databaseUrl);
  const congress = congressNumber ?? getCurrentCongress();

  const client = createCongressClient({
    apiKey: congressApiKey,
    minDelayMs: 100,
  });

  const allLegislators = await db
    .select({ bioguideId: legislators.bioguideId, fullName: legislators.fullName })
    .from(legislators);

  console.log(`Syncing sponsored bills for ${allLegislators.length} legislators...`);

  let legislatorsProcessed = 0;
  let totalBillsUpserted = 0;
  const errors: SyncSponsoredBillsResult["errors"] = [];

  for (const legislator of allLegislators) {
    try {
      const billsUpserted = await syncLegislatorBills(db, client, legislator.bioguideId, congress);
      totalBillsUpserted += billsUpserted;
      legislatorsProcessed++;

      if (legislatorsProcessed % 50 === 0) {
        console.log(
          `Processed ${legislatorsProcessed}/${allLegislators.length} legislators, ${totalBillsUpserted} bills upserted...`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`Error syncing bills for ${legislator.fullName}: ${message}`);
      errors.push({ bioguideId: legislator.bioguideId, error: message });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

  console.log(
    `Sync complete: ${totalBillsUpserted} bills upserted for ${legislatorsProcessed} legislators`
  );

  return {
    source: "congress.gov",
    changed: totalBillsUpserted > 0,
    legislatorsProcessed,
    billsUpserted: totalBillsUpserted,
    duration,
    errors,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let congress: number | undefined;

  const congressArgIndex = process.argv.findIndex((arg) => arg === "--congress");
  if (congressArgIndex !== -1 && process.argv[congressArgIndex + 1]) {
    congress = parseInt(process.argv[congressArgIndex + 1], 10);
    if (isNaN(congress)) {
      console.error("Invalid --congress value");
      process.exit(1);
    }
  }

  syncSponsoredBills(congress)
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}
