import "dotenv/config";
import { createCongressClient } from "@/lib/congress-api";
import { selectBestSummary } from "@/lib/summary-utils";
import { getBillsWithoutSummary, updateBillSummary } from "@/db/queries/bills";

export interface SyncSummariesResult {
  billsProcessed: number;
  summariesAdded: number;
  noSummaryAvailable: number;
  errors: Array<{ billNumber: string; message: string }>;
  duration: string;
}

const LOG_INTERVAL = 25;

function formatElapsed(startTime: number): string {
  const elapsed = (Date.now() - startTime) / 1000;
  return elapsed < 60 ? `${elapsed.toFixed(1)}s` : `${(elapsed / 60).toFixed(1)}m`;
}

function parseBillNumberAsInt(billNumber: string): number | null {
  const parsed = parseInt(billNumber, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function syncSummaries(limit: number = 200): Promise<SyncSummariesResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const congressApiKey = process.env.CONGRESS_API_KEY;
  if (!congressApiKey) {
    throw new Error("CONGRESS_API_KEY environment variable is required");
  }

  const { createDb } = await import("@/db/client");
  const db = createDb(databaseUrl);

  const client = createCongressClient({
    apiKey: congressApiKey,
    minDelayMs: 500,
  });

  const startTime = Date.now();
  const errors: SyncSummariesResult["errors"] = [];
  let summariesAdded = 0;
  let noSummaryAvailable = 0;

  console.log("=== SYNC SUMMARIES START ===");
  console.log(`Limit: ${limit}`);

  const billsToSync = await getBillsWithoutSummary(db, limit);
  console.log(`Found ${billsToSync.length} bills without summaries`);

  if (billsToSync.length === 0) {
    const duration = formatElapsed(startTime);
    console.log("\n=== SYNC SUMMARIES COMPLETE ===");
    console.log(`Duration: ${duration}`);
    console.log("No bills need summaries");
    return {
      billsProcessed: 0,
      summariesAdded: 0,
      noSummaryAvailable: 0,
      errors: [],
      duration,
    };
  }

  console.log("\n--- Fetching summaries from Congress.gov API ---");

  for (let i = 0; i < billsToSync.length; i++) {
    const bill = billsToSync[i];
    const billNum = parseBillNumberAsInt(bill.billNumber);

    if (billNum === null) {
      errors.push({
        billNumber: bill.billNumber,
        message: "Failed to parse bill number as integer",
      });
      continue;
    }

    try {
      const response = await client.getBillSummaries(bill.congress, bill.billType, billNum);
      const summary = selectBestSummary(response.summaries);

      if (summary) {
        await updateBillSummary(db, bill.id, summary);
        summariesAdded++;
      } else {
        noSummaryAvailable++;
      }
    } catch (err) {
      errors.push({
        billNumber: bill.billNumber,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }

    if ((i + 1) % LOG_INTERVAL === 0) {
      const rate = Math.round((i + 1) / ((Date.now() - startTime) / 60000));
      console.log(
        `[${formatElapsed(startTime)}] Processed ${i + 1}/${billsToSync.length} bills ` +
          `(${summariesAdded} added, ${noSummaryAvailable} empty) at ${rate}/min`
      );
    }
  }

  const duration = formatElapsed(startTime);

  console.log("\n=== SYNC SUMMARIES COMPLETE ===");
  console.log(`Duration: ${duration}`);
  console.log(`Bills processed: ${billsToSync.length}`);
  console.log(`Summaries added: ${summariesAdded}`);
  console.log(`No summary available: ${noSummaryAvailable}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.slice(0, 10).forEach((e) => console.log(`  - ${e.billNumber}: ${e.message}`));
    if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more`);
  }

  return {
    billsProcessed: billsToSync.length,
    summariesAdded,
    noSummaryAvailable,
    errors,
    duration,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const limitArgIndex = process.argv.findIndex((arg) => arg === "--limit");
  let limit = 200;

  if (limitArgIndex !== -1) {
    const limitArg = process.argv[limitArgIndex + 1];
    const parsed = parseInt(limitArg, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      console.error("--limit requires a positive integer value");
      process.exit(1);
    }
    limit = parsed;
  }

  console.log(`Starting summary sync with limit ${limit}...`);

  syncSummaries(limit)
    .then(async (result) => {
      const githubOutput = process.env.GITHUB_OUTPUT;
      if (githubOutput) {
        const { appendFileSync } = await import("node:fs");
        appendFileSync(githubOutput, `result=${JSON.stringify(result)}\n`);
      } else {
        console.log("\nResult:", JSON.stringify(result, null, 2));
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}
