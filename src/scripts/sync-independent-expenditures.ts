import "dotenv/config";
import { isNotNull, sql } from "drizzle-orm";
import { fetchIndependentExpenditures, createRateLimiter } from "@/lib/fec-finance";
import type { IndependentExpenditureItem } from "@/lib/fec-finance";
import type { Database } from "@/db/client";

export interface SyncIndependentExpendituresResult {
  processed: number;
  expendituresInserted: number;
  failed: number;
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

async function upsertExpenditures(
  db: Database,
  bioguideId: string,
  fecId: string,
  cycle: string,
  items: IndependentExpenditureItem[]
): Promise<number> {
  const { committees, independentExpenditures } = await import("@/db/schema");
  let inserted = 0;

  for (const item of items) {
    if (!item.committeeId || !item.supportOppose) continue;

    await db
      .insert(committees)
      .values({
        fecCommitteeId: item.committeeId,
        name: item.committeeName,
        lastUpdated: new Date(),
      })
      .onConflictDoNothing();

    await db
      .insert(independentExpenditures)
      .values({
        bioguideId,
        committeeId: item.committeeId,
        fecId,
        cycle,
        totalAmount: item.total,
        expenditureCount: item.count,
        supportOppose: item.supportOppose,
      })
      .onConflictDoUpdate({
        target: [
          independentExpenditures.bioguideId,
          independentExpenditures.committeeId,
          independentExpenditures.cycle,
          independentExpenditures.supportOppose,
        ],
        set: {
          totalAmount: sql`excluded.total_amount`,
          expenditureCount: sql`excluded.expenditure_count`,
        },
      });

    inserted++;
  }

  return inserted;
}

export async function syncIndependentExpenditures(
  db: Database,
  apiKey: string,
  cycle?: string
): Promise<SyncIndependentExpendituresResult> {
  const startTime = Date.now();
  const targetCycle = cycle ?? getCurrentCycle();
  const throttle = createRateLimiter(900);

  const legislatorsWithFecIds = await fetchLegislatorsWithFecIds(db);
  console.log(
    `Found ${legislatorsWithFecIds.length} legislators with FEC IDs for cycle ${targetCycle}`
  );

  let processed = 0;
  let expendituresInserted = 0;
  let failed = 0;

  for (const legislator of legislatorsWithFecIds) {
    const fecId = legislator.fecIds[legislator.fecIds.length - 1];

    try {
      await throttle();
      const items = await fetchIndependentExpenditures(fecId, targetCycle, apiKey);

      if (items.length > 0) {
        const inserted = await upsertExpenditures(
          db,
          legislator.bioguideId,
          fecId,
          targetCycle,
          items
        );
        expendituresInserted += inserted;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed for ${legislator.bioguideId} (${fecId}): ${message}`);
      failed++;
    }

    processed++;

    if (processed % 50 === 0) {
      console.log(
        `[${formatElapsed(startTime)}] Processed ${processed}/${legislatorsWithFecIds.length} (${expendituresInserted} expenditures)`
      );
    }
  }

  const duration = formatElapsed(startTime);

  console.log("\n=== SYNC INDEPENDENT EXPENDITURES COMPLETE ===");
  console.log(`Duration: ${duration}`);
  console.log(`Processed: ${processed}`);
  console.log(`Expenditures inserted: ${expendituresInserted}`);
  console.log(`Failed: ${failed}`);

  return { processed, expendituresInserted, failed, duration };
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
      return syncIndependentExpenditures(db, apiKey, cycle);
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
