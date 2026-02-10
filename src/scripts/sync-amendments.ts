import "dotenv/config";
import { eq, and, sql, isNull } from "drizzle-orm";
import { createCongressClient, type CongressClient } from "@/lib/congress-api";
import { buildAmendmentCongressGovUrl } from "@/lib/amendment-utils";
import type { Database } from "@/db/client";
import type { AmendmentType, BillType, Chamber } from "@/lib/types/legislation";

export interface SyncAmendmentsResult {
  billsProcessed: number;
  amendmentsUpserted: number;
  orphansRelinked: number;
  errors: Array<{ bill: string; message: string }>;
  duration: string;
}

const LOG_INTERVAL = 10;

function formatElapsed(startTime: number): string {
  const elapsed = (Date.now() - startTime) / 1000;
  return elapsed < 60 ? `${elapsed.toFixed(1)}s` : `${(elapsed / 60).toFixed(1)}m`;
}

function toAmendmentType(apiType: string): AmendmentType | null {
  const lower = apiType.toLowerCase();
  if (lower === "hamdt") return "hamdt";
  if (lower === "samdt") return "samdt";
  return null;
}

function chamberFromAmendmentType(type: AmendmentType): Chamber {
  return type === "hamdt" ? "house" : "senate";
}

interface BillForAmendmentSync {
  id: string;
  congress: number;
  billType: BillType;
  billNumber: string;
  status: string;
}

async function getAmendmentSyncOffset(db: Database): Promise<number> {
  const { syncCursors } = await import("@/db/schema");

  const [cursor] = await db.select().from(syncCursors).where(eq(syncCursors.id, "amendments_sync"));

  return cursor?.currentOffset ?? 0;
}

async function getBillsForAmendmentSync(
  db: Database,
  limit: number,
  offset: number
): Promise<BillForAmendmentSync[]> {
  const { bills } = await import("@/db/schema");

  return db
    .select({
      id: bills.id,
      congress: bills.congress,
      billType: bills.billType,
      billNumber: bills.billNumber,
      status: bills.status,
    })
    .from(bills)
    .orderBy(
      sql`CASE WHEN ${bills.status} != 'introduced' THEN 0 ELSE 1 END`,
      sql`${bills.latestActionDate} DESC`,
      bills.id
    )
    .limit(limit)
    .offset(offset);
}

async function saveOffset(db: Database, offset: number): Promise<void> {
  const { syncCursors } = await import("@/db/schema");

  await db
    .insert(syncCursors)
    .values({
      id: "amendments_sync",
      currentOffset: offset,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: syncCursors.id,
      set: {
        currentOffset: offset,
        updatedAt: new Date(),
      },
    });
}

async function relinkOrphanedAmendments(db: Database, client: CongressClient): Promise<number> {
  const { amendments, bills } = await import("@/db/schema");

  const orphans = await db
    .select({
      id: amendments.id,
      congress: amendments.congress,
      amendmentType: amendments.amendmentType,
      amendmentNumber: amendments.amendmentNumber,
    })
    .from(amendments)
    .where(isNull(amendments.amendedBillId))
    .limit(200);

  if (orphans.length === 0) return 0;

  let relinked = 0;

  for (const orphan of orphans) {
    try {
      const detail = await client.getAmendment(
        orphan.congress,
        orphan.amendmentType,
        orphan.amendmentNumber
      );

      if (!detail.amendment.amendedBill) continue;

      const billType = detail.amendment.amendedBill.type.toLowerCase() as BillType;
      const [matchingBill] = await db
        .select({ id: bills.id })
        .from(bills)
        .where(
          and(
            eq(bills.congress, detail.amendment.amendedBill.congress),
            eq(bills.billType, billType),
            eq(bills.billNumber, detail.amendment.amendedBill.number.toString())
          )
        )
        .limit(1);

      if (matchingBill) {
        await db
          .update(amendments)
          .set({ amendedBillId: matchingBill.id, updatedAt: new Date() })
          .where(eq(amendments.id, orphan.id));
        relinked++;
      }
    } catch (err) {
      console.warn(
        `  Relink failed for amendment ${orphan.amendmentType}${orphan.amendmentNumber}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      continue;
    }
  }

  return relinked;
}

export async function syncAmendments(limit: number = 50): Promise<SyncAmendmentsResult> {
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

  const startTime = Date.now();
  const errors: SyncAmendmentsResult["errors"] = [];
  let amendmentsUpserted = 0;

  console.log("=== SYNC AMENDMENTS START ===");
  console.log(`Limit: ${limit} bills`);

  const currentOffset = await getAmendmentSyncOffset(db);
  console.log(`Resuming from offset ${currentOffset}`);

  const billsToSync = await getBillsForAmendmentSync(db, limit, currentOffset);
  console.log(`Found ${billsToSync.length} bills to check for amendments`);

  if (billsToSync.length === 0) {
    const duration = formatElapsed(startTime);
    console.log("\n=== SYNC AMENDMENTS COMPLETE ===");
    console.log(`Duration: ${duration}`);
    return {
      billsProcessed: 0,
      amendmentsUpserted: 0,
      orphansRelinked: 0,
      errors: [],
      duration,
    };
  }

  const { amendments, bills } = await import("@/db/schema");

  for (let i = 0; i < billsToSync.length; i++) {
    const bill = billsToSync[i];
    const billNum = parseInt(bill.billNumber, 10);
    const billLabel = `${bill.billType}${bill.billNumber}-${bill.congress}`;

    if (isNaN(billNum)) {
      errors.push({ bill: billLabel, message: "Failed to parse bill number" });
      continue;
    }

    try {
      let apiOffset = 0;
      const pageLimit = 250;
      let totalAmendments = 0;

      while (true) {
        const response = await client.listBillAmendments(bill.congress, bill.billType, billNum, {
          limit: pageLimit,
          offset: apiOffset,
        });

        for (const amdt of response.amendments) {
          const amdtType = toAmendmentType(amdt.type);
          if (!amdtType) continue;

          const parsedAmendmentNumber = parseInt(amdt.number, 10);
          if (isNaN(parsedAmendmentNumber)) {
            errors.push({
              bill: billLabel,
              message: `Amendment ${amdtType}${amdt.number}: non-numeric amendment number`,
            });
            continue;
          }

          try {
            const detail = await client.getAmendment(bill.congress, amdtType, amdt.number);
            const amendment = detail.amendment;

            let amendedBillId: string | null = bill.id;

            if (amendment.amendedBill) {
              const linkedBillType = amendment.amendedBill.type.toLowerCase() as BillType;
              const [linkedBill] = await db
                .select({ id: bills.id })
                .from(bills)
                .where(
                  and(
                    eq(bills.congress, amendment.amendedBill.congress),
                    eq(bills.billType, linkedBillType),
                    eq(bills.billNumber, amendment.amendedBill.number.toString())
                  )
                )
                .limit(1);
              amendedBillId = linkedBill?.id ?? bill.id;
            }

            const chamber: Chamber = chamberFromAmendmentType(amdtType);

            await db
              .insert(amendments)
              .values({
                amendmentNumber: amdt.number,
                amendmentType: amdtType,
                congress: bill.congress,
                chamber,
                description: amendment.description ?? null,
                purpose: amendment.purpose ?? null,
                latestActionDate: amendment.latestAction?.actionDate
                  ? new Date(amendment.latestAction.actionDate)
                  : null,
                latestActionText: amendment.latestAction?.text ?? null,
                sponsorBioguideId: amendment.sponsors?.[0]?.bioguideId ?? null,
                amendedBillId,
                congressGovUrl: buildAmendmentCongressGovUrl(
                  bill.congress,
                  amdtType,
                  parsedAmendmentNumber
                ),
              })
              .onConflictDoUpdate({
                target: [amendments.congress, amendments.amendmentType, amendments.amendmentNumber],
                set: {
                  description: sql`excluded.description`,
                  purpose: sql`excluded.purpose`,
                  latestActionDate: sql`excluded.latest_action_date`,
                  latestActionText: sql`excluded.latest_action_text`,
                  sponsorBioguideId: sql`excluded.sponsor_bioguide_id`,
                  amendedBillId: sql`excluded.amended_bill_id`,
                  updatedAt: new Date(),
                },
              });

            amendmentsUpserted++;
            totalAmendments++;
          } catch (err) {
            errors.push({
              bill: billLabel,
              message: `Amendment ${amdtType}${amdt.number}: ${err instanceof Error ? err.message : "Unknown error"}`,
            });
          }
        }

        if (!response.pagination?.next || response.amendments.length < pageLimit) {
          break;
        }
        apiOffset += pageLimit;
      }

      if (totalAmendments > 0) {
        console.log(`  ${billLabel}: ${totalAmendments} amendments`);
      }
    } catch (err) {
      errors.push({
        bill: billLabel,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }

    if ((i + 1) % LOG_INTERVAL === 0) {
      await saveOffset(db, currentOffset + i + 1);
      console.log(
        `[${formatElapsed(startTime)}] Processed ${i + 1}/${billsToSync.length} bills ` +
          `(${amendmentsUpserted} amendments upserted)`
      );
    }
  }

  const newOffset = currentOffset + billsToSync.length;
  if (billsToSync.length < limit) {
    console.log("Reached end of bills — resetting offset to 0 for next run");
    await saveOffset(db, 0);
  } else {
    await saveOffset(db, newOffset);
  }

  console.log("\n--- Relinking orphaned amendments ---");
  const orphansRelinked = await relinkOrphanedAmendments(db, client);
  if (orphansRelinked > 0) {
    console.log(`Relinked ${orphansRelinked} orphaned amendments`);
  }

  const duration = formatElapsed(startTime);

  console.log("\n=== SYNC AMENDMENTS COMPLETE ===");
  console.log(`Duration: ${duration}`);
  console.log(`Bills processed: ${billsToSync.length}`);
  console.log(`Amendments upserted: ${amendmentsUpserted}`);
  console.log(`Orphans relinked: ${orphansRelinked}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.slice(0, 10).forEach((e) => console.log(`  - ${e.bill}: ${e.message}`));
    if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more`);
  }

  return {
    billsProcessed: billsToSync.length,
    amendmentsUpserted,
    orphansRelinked,
    errors,
    duration,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const limitArgIndex = process.argv.findIndex((arg) => arg === "--limit");
  let limit = 50;

  if (limitArgIndex !== -1) {
    const limitArg = process.argv[limitArgIndex + 1];
    const parsed = parseInt(limitArg, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      console.error("--limit requires a positive integer value");
      process.exit(1);
    }
    limit = parsed;
  }

  console.log(`Starting amendment sync with limit ${limit}...`);

  syncAmendments(limit)
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
