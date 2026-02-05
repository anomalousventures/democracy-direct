import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { createCongressClient, getCurrentCongress, type CongressClient } from "@/lib/congress-api";
import { parseBillNumber, buildCongressGovUrl } from "@/lib/bill-utils";
import type { Database } from "@/db/client";
import type { BillListItem, BillStatus, BillType } from "@/lib/types/legislation";

export interface SyncBillsResult {
  source: "congress.gov";
  changed: boolean;
  direction: "forward" | "backward";
  congressNumber: number;
  billsUpserted: number;
  duration: string;
  cursorPosition: string | null;
  oldestCongress: number | null;
  errors: Array<{ billNumber: string; message: string }>;
  warnings: Array<{ billNumber: string; message: string }>;
}

interface BillUpsertData {
  billNumber: string;
  billType: BillType;
  congress: number;
  title: string;
  summary: string | null;
  status: BillStatus;
  subjects: string[];
  introducedDate: Date;
  latestActionDate: Date;
  latestActionText: string;
  sponsorBioguideId: string | null;
  congressGovUrl: string;
}

const BATCH_SIZE = 50;
const TARGET_OLDEST_CONGRESS = 117;
const BACKWARD_BILLS_PER_RUN = 1500;
const LOG_INTERVAL = 250;

function formatElapsed(startTime: number): string {
  const elapsed = (Date.now() - startTime) / 1000;
  return elapsed < 60 ? `${elapsed.toFixed(1)}s` : `${(elapsed / 60).toFixed(1)}m`;
}

function formatDateForApi(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function logProgress(
  phase: string,
  startTime: number,
  count: number,
  total?: number,
  errors?: number
): void {
  const elapsed = formatElapsed(startTime);
  const rate = count > 0 ? Math.round(count / ((Date.now() - startTime) / 60000)) : 0;
  const totalStr = total !== undefined ? `/${total}` : "";
  const errorStr = errors !== undefined && errors > 0 ? ` (${errors} errors)` : "";
  console.log(`[${elapsed}] ${phase}: ${count}${totalStr} bills at ${rate}/min${errorStr}`);
}

export function inferBillStatus(latestActionText: string): BillStatus {
  const actionLower = latestActionText.toLowerCase();

  if (actionLower.includes("became public law") || actionLower.includes("became law")) {
    return "became_law";
  }
  if (
    actionLower.includes("signed by president") ||
    actionLower.includes("signed by the president")
  ) {
    return "signed";
  }
  if (actionLower.includes("vetoed")) {
    if (actionLower.includes("veto overridden")) {
      return "veto_overridden";
    }
    return "vetoed";
  }
  if (actionLower.includes("presented to president") || actionLower.includes("to the president")) {
    return "to_president";
  }
  if (actionLower.includes("resolving differences")) {
    return "resolving_differences";
  }
  if (actionLower.includes("passed senate") || actionLower.includes("passed/agreed to in senate")) {
    return "passed_senate";
  }
  if (actionLower.includes("passed house") || actionLower.includes("passed/agreed to in house")) {
    return "passed_house";
  }

  return "introduced";
}

export interface TransformResult {
  data: BillUpsertData | null;
  warning: { billNumber: string; message: string } | null;
  error: { billNumber: string; message: string } | null;
}

export function transformBillItem(
  item: BillListItem,
  detailIntroducedDate?: string
): TransformResult {
  const billIdentifier = `${item.type}${item.number}`;
  const parsed = parseBillNumber(billIdentifier);

  if (!parsed) {
    return {
      data: null,
      warning: null,
      error: { billNumber: billIdentifier, message: "Failed to parse bill number" },
    };
  }

  const latestActionDate = item.latestAction?.actionDate
    ? new Date(item.latestAction.actionDate)
    : null;

  const introducedDate = detailIntroducedDate ? new Date(detailIntroducedDate) : latestActionDate;

  if (!introducedDate) {
    return {
      data: null,
      warning: null,
      error: {
        billNumber: billIdentifier,
        message: "Missing both introducedDate and latestActionDate",
      },
    };
  }

  const latestActionText = item.latestAction?.text ?? "Introduced";

  return {
    data: {
      billNumber: `${item.type.toUpperCase()}.${item.number}`,
      billType: parsed.type,
      congress: item.congress,
      title: item.title,
      summary: null,
      status: inferBillStatus(latestActionText),
      subjects: item.policyArea?.name ? [item.policyArea.name] : [],
      introducedDate,
      latestActionDate: latestActionDate ?? introducedDate,
      latestActionText,
      sponsorBioguideId: item.sponsors?.[0]?.bioguideId ?? null,
      congressGovUrl: buildCongressGovUrl(item.congress, parsed.type, parsed.number),
    },
    warning: detailIntroducedDate
      ? null
      : {
          billNumber: billIdentifier,
          message: "Detail fetch failed, used latestActionDate as fallback",
        },
    error: null,
  };
}

async function getOrCreateCursor(
  db: Database,
  cursorId: string
): Promise<{
  cursor: string | null;
  oldestCongress: number | null;
  newestCongress: number | null;
}> {
  const { syncCursors } = await import("@/db/schema");

  const [existing] = await db.select().from(syncCursors).where(eq(syncCursors.id, cursorId));

  if (existing) {
    return {
      cursor: existing.cursor,
      oldestCongress: existing.oldestCongress,
      newestCongress: existing.newestCongress,
    };
  }

  return { cursor: null, oldestCongress: null, newestCongress: null };
}

async function updateCursor(
  db: Database,
  cursorId: string,
  cursor: string | null,
  oldestCongress: number | null,
  newestCongress: number | null
): Promise<void> {
  const { syncCursors } = await import("@/db/schema");

  await db
    .insert(syncCursors)
    .values({
      id: cursorId,
      cursor,
      oldestCongress,
      newestCongress,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: syncCursors.id,
      set: {
        cursor,
        oldestCongress,
        newestCongress,
        updatedAt: new Date(),
      },
    });
}

async function upsertBills(db: Database, billsData: BillUpsertData[]): Promise<number> {
  const { bills } = await import("@/db/schema");

  let upsertCount = 0;

  for (let i = 0; i < billsData.length; i += BATCH_SIZE) {
    const batch = billsData.slice(i, i + BATCH_SIZE);

    await db
      .insert(bills)
      .values(
        batch.map((b) => ({
          billNumber: b.billNumber,
          billType: b.billType,
          congress: b.congress,
          title: b.title,
          summary: b.summary,
          status: b.status,
          subjects: b.subjects,
          introducedDate: b.introducedDate,
          latestActionDate: b.latestActionDate,
          latestActionText: b.latestActionText,
          sponsorBioguideId: b.sponsorBioguideId,
          congressGovUrl: b.congressGovUrl,
        }))
      )
      .onConflictDoUpdate({
        target: [bills.congress, bills.billType, bills.billNumber],
        set: {
          title: sql`excluded.title`,
          summary: sql`excluded.summary`,
          status: sql`excluded.status`,
          subjects: sql`excluded.subjects`,
          latestActionDate: sql`excluded.latest_action_date`,
          latestActionText: sql`excluded.latest_action_text`,
          sponsorBioguideId: sql`excluded.sponsor_bioguide_id`,
          updatedAt: new Date(),
        },
      });

    upsertCount += batch.length;
  }

  return upsertCount;
}

async function syncForward(
  db: Database,
  client: CongressClient,
  errors: SyncBillsResult["errors"],
  warnings: SyncBillsResult["warnings"]
): Promise<SyncBillsResult> {
  const startTime = Date.now();
  const cursorId = "bills_forward";
  const currentCongress = getCurrentCongress();

  const { cursor: lastSyncTime, newestCongress } = await getOrCreateCursor(db, cursorId);

  console.log("=== FORWARD SYNC START ===");
  console.log(`Congress: ${currentCongress}`);
  console.log(`Since: ${lastSyncTime ?? "beginning (initial sync)"}`);
  console.log(`Target: Current Congress bills updated since last sync`);

  const billsToUpsert: BillUpsertData[] = [];
  let offset = 0;
  const limit = 250;
  let hasMore = true;

  console.log("\n--- Fetching from Congress.gov API ---");
  const fetchStartTime = Date.now();

  while (hasMore) {
    const response = await client.listBills({
      congress: currentCongress,
      fromDateTime: lastSyncTime ?? undefined,
      sort: "updateDate+asc",
      limit,
      offset,
    });

    for (const item of response.bills) {
      let detailIntroducedDate: string | undefined;
      try {
        const detail = await client.getBill(item.congress, item.type, item.number);
        detailIntroducedDate = detail.bill.introducedDate;
      } catch (err) {
        errors.push({
          billNumber: `${item.type}${item.number}`,
          message: `Detail fetch failed: ${err instanceof Error ? err.message : "Unknown"}`,
        });
      }

      const result = transformBillItem(item, detailIntroducedDate);
      if (result.data) {
        billsToUpsert.push(result.data);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
      if (result.error) {
        errors.push(result.error);
      }
    }

    hasMore = !!response.pagination?.next && response.bills.length === limit;
    offset += limit;

    if (offset % LOG_INTERVAL === 0) {
      logProgress("Fetch", fetchStartTime, billsToUpsert.length, undefined, errors.length);
    }
  }

  console.log(
    `\n--- Fetch complete: ${billsToUpsert.length} bills in ${formatElapsed(fetchStartTime)} ---`
  );

  if (warnings.length > 0) {
    console.log(`\nTransform warnings (${warnings.length}):`);
    warnings.slice(0, 5).forEach((w) => console.log(`  - ${w.billNumber}: ${w.message}`));
    if (warnings.length > 5) console.log(`  ... and ${warnings.length - 5} more`);
  }

  if (errors.length > 0) {
    console.log(`\nTransform errors (${errors.length}):`);
    errors.slice(0, 5).forEach((e) => console.log(`  - ${e.billNumber}: ${e.message}`));
    if (errors.length > 5) console.log(`  ... and ${errors.length - 5} more`);
  }

  console.log("\n--- Upserting to database ---");
  const upsertStartTime = Date.now();
  const upsertCount = await upsertBills(db, billsToUpsert);
  console.log(`Upserted ${upsertCount} bills in ${formatElapsed(upsertStartTime)}`);

  const newCursor = formatDateForApi(new Date());
  await updateCursor(db, cursorId, newCursor, null, newestCongress ?? currentCongress);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

  console.log("\n=== FORWARD SYNC COMPLETE ===");
  console.log(`Duration: ${duration}`);
  console.log(`Bills upserted: ${upsertCount}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`New cursor: ${newCursor}`);

  return {
    source: "congress.gov",
    changed: upsertCount > 0,
    direction: "forward",
    congressNumber: currentCongress,
    billsUpserted: upsertCount,
    duration,
    cursorPosition: newCursor,
    oldestCongress: null,
    errors,
    warnings,
  };
}

async function syncBackward(
  db: Database,
  client: CongressClient,
  errors: SyncBillsResult["errors"],
  warnings: SyncBillsResult["warnings"]
): Promise<SyncBillsResult> {
  const startTime = Date.now();
  const cursorId = "bills_backward";
  const currentCongress = getCurrentCongress();

  const { oldestCongress: previousOldest } = await getOrCreateCursor(db, cursorId);

  const targetCongress = previousOldest ? previousOldest - 1 : currentCongress;

  if (targetCongress < TARGET_OLDEST_CONGRESS) {
    console.log("=== BACKWARD SYNC COMPLETE ===");
    console.log(`Already synced to target Congress ${TARGET_OLDEST_CONGRESS}`);
    console.log(`Coverage: Congress ${TARGET_OLDEST_CONGRESS} to ${currentCongress}`);
    return {
      source: "congress.gov",
      changed: false,
      direction: "backward",
      congressNumber: targetCongress,
      billsUpserted: 0,
      duration: "0s",
      cursorPosition: null,
      oldestCongress: previousOldest,
      errors: [],
      warnings: [],
    };
  }

  const isPastCongress = targetCongress < currentCongress;

  console.log("=== BACKWARD SYNC START ===");
  console.log(`Target Congress: ${targetCongress}`);
  console.log(`Previously synced oldest: ${previousOldest ?? "none"}`);
  console.log(`Target oldest: ${TARGET_OLDEST_CONGRESS}`);
  console.log(`Max bills per run: ${BACKWARD_BILLS_PER_RUN}`);
  if (isPastCongress) {
    console.log(`Filter: Skipping "introduced" status bills (past Congress)`);
  }

  const billsToUpsert: BillUpsertData[] = [];
  let billsFetched = 0;
  let billsSkipped = 0;
  let offset = 0;
  const limit = 250;
  let hasMore = true;

  console.log("\n--- Fetching from Congress.gov API ---");
  const fetchStartTime = Date.now();

  while (hasMore && billsFetched < BACKWARD_BILLS_PER_RUN) {
    const response = await client.listBills({
      congress: targetCongress,
      limit,
      offset,
    });

    for (const item of response.bills) {
      if (billsFetched >= BACKWARD_BILLS_PER_RUN) break;
      billsFetched++;

      let detailIntroducedDate: string | undefined;
      try {
        const detail = await client.getBill(item.congress, item.type, item.number);
        detailIntroducedDate = detail.bill.introducedDate;
      } catch (err) {
        errors.push({
          billNumber: `${item.type}${item.number}`,
          message: `Detail fetch failed: ${err instanceof Error ? err.message : "Unknown"}`,
        });
      }

      const result = transformBillItem(item, detailIntroducedDate);
      if (result.data) {
        if (isPastCongress && result.data.status === "introduced") {
          billsSkipped++;
        } else {
          billsToUpsert.push(result.data);
        }
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
      if (result.error) {
        errors.push(result.error);
      }
    }

    hasMore = !!response.pagination?.next && response.bills.length === limit;
    offset += limit;

    if (offset % LOG_INTERVAL === 0) {
      logProgress("Fetch", fetchStartTime, billsFetched, BACKWARD_BILLS_PER_RUN, errors.length);
    }
  }

  console.log(
    `\n--- Fetch complete: ${billsFetched} fetched, ${billsToUpsert.length} to upsert, ${billsSkipped} skipped in ${formatElapsed(fetchStartTime)} ---`
  );

  if (warnings.length > 0) {
    console.log(`\nTransform warnings (${warnings.length}):`);
    warnings.slice(0, 5).forEach((w) => console.log(`  - ${w.billNumber}: ${w.message}`));
    if (warnings.length > 5) console.log(`  ... and ${warnings.length - 5} more`);
  }

  if (errors.length > 0) {
    console.log(`\nTransform errors (${errors.length}):`);
    errors.slice(0, 5).forEach((e) => console.log(`  - ${e.billNumber}: ${e.message}`));
    if (errors.length > 5) console.log(`  ... and ${errors.length - 5} more`);
  }

  console.log("\n--- Upserting to database ---");
  const upsertStartTime = Date.now();
  const upsertCount = await upsertBills(db, billsToUpsert);
  console.log(`Upserted ${upsertCount} bills in ${formatElapsed(upsertStartTime)}`);

  const congressFullySynced = !hasMore || billsFetched < BACKWARD_BILLS_PER_RUN;
  const newOldestCongress = congressFullySynced ? targetCongress : previousOldest;

  await updateCursor(db, cursorId, null, newOldestCongress, currentCongress);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

  console.log("\n=== BACKWARD SYNC COMPLETE ===");
  console.log(`Duration: ${duration}`);
  console.log(
    `Congress ${targetCongress}: ${congressFullySynced ? "FULLY SYNCED" : "PARTIAL - will continue"}`
  );
  console.log(`Bills upserted: ${upsertCount}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Oldest synced Congress: ${newOldestCongress ?? "none yet"}`);

  return {
    source: "congress.gov",
    changed: upsertCount > 0,
    direction: "backward",
    congressNumber: targetCongress,
    billsUpserted: upsertCount,
    duration,
    cursorPosition: null,
    oldestCongress: newOldestCongress,
    errors,
    warnings,
  };
}

export async function syncBills(direction: "forward" | "backward"): Promise<SyncBillsResult> {
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
    minDelayMs: 200,
  });

  const errors: SyncBillsResult["errors"] = [];
  const warnings: SyncBillsResult["warnings"] = [];

  const syncHandlers = {
    forward: syncForward,
    backward: syncBackward,
  };

  return syncHandlers[direction](db, client, errors, warnings);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const directionArgIndex = process.argv.findIndex((arg) => arg === "--direction");
  let direction: "forward" | "backward" = "forward";

  if (directionArgIndex !== -1) {
    const dirArg = process.argv[directionArgIndex + 1];
    if (!dirArg || (dirArg !== "forward" && dirArg !== "backward")) {
      console.error("--direction requires a value: 'forward' or 'backward'");
      process.exit(1);
    }
    direction = dirArg;
  }

  console.log(`Starting bill sync in ${direction} mode...`);

  syncBills(direction)
    .then(async (result) => {
      const githubOutput = process.env.GITHUB_OUTPUT;
      if (githubOutput) {
        const { appendFileSync } = await import("node:fs");
        appendFileSync(githubOutput, `result=${JSON.stringify(result)}\n`);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}
