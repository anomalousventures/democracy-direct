import "dotenv/config";
import { isNotNull, sql } from "drizzle-orm";
import { fetchAllCandidateTotals, delay } from "@/lib/fec-finance";
import type { CandidateFinanceData } from "@/lib/fec-finance";
import type { Database } from "@/db/client";

const BATCH_SIZE = 50;

export interface SyncCampaignFinanceResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  duration: string;
}

function getCurrentCycle(): string {
  const year = new Date().getFullYear();
  return (year % 2 === 0 ? year : year + 1).toString();
}

function formatElapsed(startTime: number): string {
  const elapsed = (Date.now() - startTime) / 1000;
  return elapsed < 60 ? `${elapsed.toFixed(1)}s` : `${(elapsed / 60).toFixed(1)}m`;
}

async function fetchLegislatorsWithFecIds(
  db: Database
): Promise<Array<{ bioguideId: string; fecIds: string[] }>> {
  const { legislators } = await import("@/db/schema");
  const rows = await db
    .select({ bioguideId: legislators.bioguideId, fecIds: legislators.fecIds })
    .from(legislators)
    .where(isNotNull(legislators.fecIds));

  return rows.filter(
    (row): row is { bioguideId: string; fecIds: string[] } =>
      row.fecIds !== null && row.fecIds.length > 0
  );
}

export async function syncCampaignFinance(
  db: Database,
  apiKey: string,
  cycle?: string
): Promise<SyncCampaignFinanceResult> {
  const startTime = Date.now();
  const targetCycle = cycle ?? getCurrentCycle();

  const { campaignFinance } = await import("@/db/schema");

  console.log(`Fetching bulk FEC data for cycle ${targetCycle}...`);
  const senateData = await fetchAllCandidateTotals("S", targetCycle, apiKey);
  await delay(500);
  const houseData = await fetchAllCandidateTotals("H", targetCycle, apiKey);

  const bulkData = new Map([...senateData, ...houseData]);
  console.log(
    `Fetched ${bulkData.size} candidates (${senateData.size} Senate, ${houseData.size} House)`
  );

  const legislatorsWithFecIds = await fetchLegislatorsWithFecIds(db);
  console.log(`Found ${legislatorsWithFecIds.length} legislators with FEC IDs`);

  const matched: Array<{
    bioguideId: string;
    fecId: string;
    data: CandidateFinanceData;
  }> = [];
  let skipped = 0;

  for (const legislator of legislatorsWithFecIds) {
    const fecId = legislator.fecIds[legislator.fecIds.length - 1];
    const data = bulkData.get(fecId);

    if (data) {
      matched.push({ bioguideId: legislator.bioguideId, fecId, data });
    } else {
      skipped++;
    }
  }

  console.log(`Matched: ${matched.length}, No FEC data: ${skipped}`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < matched.length; i += BATCH_SIZE) {
    const batch = matched.slice(i, i + BATCH_SIZE);

    try {
      await db
        .insert(campaignFinance)
        .values(
          batch.map((row) => ({
            bioguideId: row.bioguideId,
            fecId: row.fecId,
            cycle: targetCycle,
            totalReceipts: row.data.totalReceipts,
            totalDisbursements: row.data.totalDisbursements,
            cashOnHand: row.data.cashOnHand,
            totalFromPACs: row.data.totalFromPACs,
            totalFromIndividuals: row.data.totalFromIndividuals,
            debtsOwed: row.data.debtsOwed,
            sourceUrl: row.data.fecUri,
            lastUpdated: new Date(),
          }))
        )
        .onConflictDoUpdate({
          target: [campaignFinance.bioguideId, campaignFinance.cycle],
          set: {
            fecId: sql`excluded.fec_id`,
            totalReceipts: sql`excluded.total_receipts`,
            totalDisbursements: sql`excluded.total_disbursements`,
            cashOnHand: sql`excluded.cash_on_hand`,
            totalFromPACs: sql`excluded.total_from_pacs`,
            totalFromIndividuals: sql`excluded.total_from_individuals`,
            debtsOwed: sql`excluded.debts_owed`,
            sourceUrl: sql`excluded.source_url`,
            lastUpdated: sql`excluded.last_updated`,
          },
        });

      succeeded += batch.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Batch upsert failed (rows ${i}-${i + batch.length}): ${message}`);
      failed += batch.length;
    }

    if (i + BATCH_SIZE < matched.length) {
      console.log(
        `[${formatElapsed(startTime)}] Upserted ${Math.min(i + BATCH_SIZE, matched.length)}/${matched.length}`
      );
    }
  }

  const duration = formatElapsed(startTime);

  console.log("\n=== SYNC CAMPAIGN FINANCE COMPLETE ===");
  console.log(`Duration: ${duration}`);
  console.log(`Processed: ${legislatorsWithFecIds.length}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Skipped (no data): ${skipped}`);
  console.log(`Failed: ${failed}`);

  return {
    processed: legislatorsWithFecIds.length,
    succeeded,
    failed,
    skipped,
    duration,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) {
    console.error("FEC_API_KEY environment variable is required");
    process.exit(1);
  }

  const cycleArgIndex = process.argv.findIndex((arg) => arg === "--cycle");
  let cycle: string | undefined;
  if (cycleArgIndex !== -1 && process.argv[cycleArgIndex + 1]) {
    cycle = process.argv[cycleArgIndex + 1];
  }

  import("@/db/client")
    .then(({ createDb }) => {
      const db = createDb(databaseUrl);
      return syncCampaignFinance(db, apiKey, cycle);
    })
    .then(async (result) => {
      const githubOutput = process.env.GITHUB_OUTPUT;
      if (githubOutput) {
        const { appendFileSync } = await import("node:fs");
        appendFileSync(githubOutput, `result=${JSON.stringify(result)}\n`);
      }
      console.log(JSON.stringify(result));
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}
