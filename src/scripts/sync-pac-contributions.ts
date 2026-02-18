import "dotenv/config";
import { eq, isNotNull, sql } from "drizzle-orm";
import {
  fetchCandidateCommittee,
  fetchPacContributions,
  createRateLimiter,
} from "@/lib/fec-finance";
import type { PacContributionItem } from "@/lib/fec-finance";
import type { Database } from "@/db/client";

let apiBudget = 450;

export interface SyncPacContributionsResult {
  processed: number;
  committeesFound: number;
  contributionsInserted: number;
  apiCallsMade: number;
  budgetExhausted: boolean;
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

async function getOffset(db: Database): Promise<number> {
  const { syncCursors } = await import("@/db/schema");
  const [row] = await db
    .select({ currentOffset: syncCursors.currentOffset })
    .from(syncCursors)
    .where(eq(syncCursors.id, "pac_contributions_sync"));
  return row?.currentOffset ?? 0;
}

async function saveOffset(db: Database, offset: number): Promise<void> {
  const { syncCursors } = await import("@/db/schema");
  await db
    .insert(syncCursors)
    .values({ id: "pac_contributions_sync", currentOffset: offset, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: syncCursors.id,
      set: { currentOffset: offset, updatedAt: new Date() },
    });
}

interface AggregatedContribution {
  contributorId: string;
  contributorName: string;
  totalAmount: number;
  contributionCount: number;
  lastContributionDate: string;
}

function aggregateContributions(items: PacContributionItem[]): AggregatedContribution[] {
  const byContributor = new Map<
    string,
    { name: string; total: number; count: number; latestDate: string }
  >();

  for (const item of items) {
    if (item.memoCode === "X") continue;
    if (!item.contributorId) continue;

    const existing = byContributor.get(item.contributorId);
    if (existing) {
      existing.total += item.amount;
      existing.count += 1;
      if (item.date > existing.latestDate) {
        existing.latestDate = item.date;
      }
    } else {
      byContributor.set(item.contributorId, {
        name: item.contributorName,
        total: item.amount,
        count: 1,
        latestDate: item.date,
      });
    }
  }

  return Array.from(byContributor.entries()).map(([contributorId, data]) => ({
    contributorId,
    contributorName: data.name,
    totalAmount: data.total,
    contributionCount: data.count,
    lastContributionDate: data.latestDate,
  }));
}

export async function syncPacContributions(
  db: Database,
  apiKey: string,
  cycle?: string
): Promise<SyncPacContributionsResult> {
  const startTime = Date.now();
  const targetCycle = cycle ?? getCurrentCycle();
  const throttle = createRateLimiter(900);

  const { candidateCommittees } = await import("@/db/schema");
  const { committees } = await import("@/db/schema");
  const { pacContributions } = await import("@/db/schema");

  const legislatorsWithFecIds = await fetchLegislatorsWithFecIds(db);
  const startOffset = await getOffset(db);

  console.log(`=== SYNC PAC CONTRIBUTIONS ===`);
  console.log(`Cycle: ${targetCycle}`);
  console.log(`Legislators with FEC IDs: ${legislatorsWithFecIds.length}`);
  console.log(`Resuming from offset: ${startOffset}`);
  console.log(`API budget: ${apiBudget} calls`);

  let apiCallsMade = 0;
  let processed = 0;
  let committeesFound = 0;
  let contributionsInserted = 0;

  for (let i = startOffset; i < legislatorsWithFecIds.length; i++) {
    if (apiCallsMade >= apiBudget) {
      console.log(`\nAPI budget exhausted (${apiCallsMade}/${apiBudget}), saving cursor`);
      await saveOffset(db, i);

      const duration = formatElapsed(startTime);
      console.log("\n=== SYNC PAC CONTRIBUTIONS PAUSED ===");
      console.log(`Duration: ${duration}`);
      console.log(`Processed: ${processed}`);
      console.log(`Committees found: ${committeesFound}`);
      console.log(`Contributions inserted: ${contributionsInserted}`);
      console.log(`API calls: ${apiCallsMade}`);
      console.log(`Next offset: ${i}`);

      return {
        processed,
        committeesFound,
        contributionsInserted,
        apiCallsMade,
        budgetExhausted: true,
        duration,
      };
    }

    const legislator = legislatorsWithFecIds[i];
    const fecId = legislator.fecIds[legislator.fecIds.length - 1];
    processed++;

    const [existingCommittee] = await db
      .select({ committeeId: candidateCommittees.committeeId })
      .from(candidateCommittees)
      .where(eq(candidateCommittees.fecId, fecId));

    let principalCommitteeId: string | null = existingCommittee?.committeeId ?? null;

    if (!principalCommitteeId) {
      await throttle();
      apiCallsMade++;
      principalCommitteeId = await fetchCandidateCommittee(fecId, targetCycle, apiKey);

      if (principalCommitteeId) {
        await db
          .insert(committees)
          .values({
            fecCommitteeId: principalCommitteeId,
            name: `Committee for ${fecId}`,
            lastUpdated: new Date(),
          })
          .onConflictDoNothing();

        await db
          .insert(candidateCommittees)
          .values({ fecId, committeeId: principalCommitteeId, cycle: targetCycle })
          .onConflictDoNothing();

        committeesFound++;
      }
    } else {
      committeesFound++;
    }

    if (!principalCommitteeId) {
      if (processed % 50 === 0) {
        console.log(
          `[${formatElapsed(startTime)}] Processed ${processed}/${legislatorsWithFecIds.length - startOffset} (${apiCallsMade} API calls)`
        );
      }
      continue;
    }

    await throttle();
    apiCallsMade++;
    const contributions = await fetchPacContributions(principalCommitteeId, targetCycle, apiKey);

    const aggregated = aggregateContributions(contributions);

    for (const agg of aggregated) {
      await db
        .insert(committees)
        .values({
          fecCommitteeId: agg.contributorId,
          name: agg.contributorName,
          lastUpdated: new Date(),
        })
        .onConflictDoNothing();

      await db
        .insert(pacContributions)
        .values({
          bioguideId: legislator.bioguideId,
          committeeId: agg.contributorId,
          fecId,
          recipientCommitteeId: principalCommitteeId,
          cycle: targetCycle,
          totalAmount: agg.totalAmount,
          contributionCount: agg.contributionCount,
          lastContributionDate: agg.lastContributionDate
            ? new Date(agg.lastContributionDate)
            : null,
        })
        .onConflictDoUpdate({
          target: [
            pacContributions.bioguideId,
            pacContributions.committeeId,
            pacContributions.cycle,
          ],
          set: {
            totalAmount: sql`excluded.total_amount`,
            contributionCount: sql`excluded.contribution_count`,
            lastContributionDate: sql`excluded.last_contribution_date`,
          },
        });

      contributionsInserted++;
    }

    if (processed % 50 === 0) {
      console.log(
        `[${formatElapsed(startTime)}] Processed ${processed}/${legislatorsWithFecIds.length - startOffset} (${apiCallsMade} API calls, ${contributionsInserted} contributions)`
      );
    }
  }

  await saveOffset(db, 0);

  const duration = formatElapsed(startTime);

  console.log("\n=== SYNC PAC CONTRIBUTIONS COMPLETE ===");
  console.log(`Duration: ${duration}`);
  console.log(`Processed: ${processed}`);
  console.log(`Committees found: ${committeesFound}`);
  console.log(`Contributions inserted: ${contributionsInserted}`);
  console.log(`API calls: ${apiCallsMade}`);

  return {
    processed,
    committeesFound,
    contributionsInserted,
    apiCallsMade,
    budgetExhausted: false,
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

  const limitArgIndex = process.argv.findIndex((arg) => arg === "--limit");
  if (limitArgIndex !== -1) {
    const limitArg = process.argv[limitArgIndex + 1];
    const parsed = parseInt(limitArg, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      console.error("--limit requires a positive integer value");
      process.exit(1);
    }
    apiBudget = parsed;
  }

  import("@/db/client")
    .then(({ createDb }) => {
      const db = createDb(databaseUrl);
      return syncPacContributions(db, apiKey, cycle);
    })
    .then(async (result) => {
      const githubOutput = process.env.GITHUB_OUTPUT;
      if (githubOutput) {
        const { appendFileSync } = await import("node:fs");
        appendFileSync(githubOutput, `result=${JSON.stringify(result)}\n`);
      }
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}
