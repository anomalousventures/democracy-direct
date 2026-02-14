import "dotenv/config";
import { isNotNull, sql } from "drizzle-orm";
import { getCandidateByFecId, delay } from "@/lib/propublica-finance";
import type { Database } from "@/db/client";

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

  const legislatorsWithFecIds = await fetchLegislatorsWithFecIds(db);
  console.log(
    `Found ${legislatorsWithFecIds.length} legislators with FEC IDs, syncing cycle ${targetCycle}`
  );

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < legislatorsWithFecIds.length; i++) {
    const legislator = legislatorsWithFecIds[i];
    const fecId = legislator.fecIds[legislator.fecIds.length - 1];

    try {
      const data = await getCandidateByFecId(apiKey, targetCycle, fecId);

      if (!data) {
        console.warn(
          `[${i + 1}/${legislatorsWithFecIds.length}] No data for ${legislator.bioguideId} (FEC: ${fecId})`
        );
        skipped++;
      } else {
        await db
          .insert(campaignFinance)
          .values({
            bioguideId: legislator.bioguideId,
            fecId,
            cycle: targetCycle,
            totalReceipts: data.totalReceipts,
            totalDisbursements: data.totalDisbursements,
            cashOnHand: data.cashOnHand,
            totalFromPACs: data.totalFromPACs,
            totalFromIndividuals: data.totalFromIndividuals,
            debtsOwed: data.debtsOwed,
            sourceUrl: data.fecUri,
            lastUpdated: new Date(),
          })
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
        succeeded++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[${i + 1}/${legislatorsWithFecIds.length}] Error for ${legislator.bioguideId} (FEC: ${fecId}): ${message}`
      );
      failed++;
    }

    if (i < legislatorsWithFecIds.length - 1) {
      await delay(100);
    }

    if ((i + 1) % 50 === 0) {
      console.log(
        `[${formatElapsed(startTime)}] Progress: ${i + 1}/${legislatorsWithFecIds.length} ` +
          `(${succeeded} ok, ${skipped} skipped, ${failed} errors)`
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

  const apiKey = process.env.PROPUBLICA_CAMPAIGN_FINANCE_KEY;
  if (!apiKey) {
    console.error("PROPUBLICA_CAMPAIGN_FINANCE_KEY environment variable is required");
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
