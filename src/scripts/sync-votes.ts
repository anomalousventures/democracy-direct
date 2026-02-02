import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import {
  createCongressClient,
  getCurrentCongress,
  getCurrentSession,
  type CongressClient,
} from "@/lib/congress-api";
import {
  createSenateVoteClient,
  normalizeVotePosition,
  buildSenateVoteUrl,
  type SenateVoteClient,
} from "@/lib/senate-votes";
import type { Database } from "@/db/client";
import type { VotePosition } from "@/lib/types/legislation";

export interface SyncVotesResult {
  source: "congress.gov + senate.gov";
  changed: boolean;
  congressNumber: number;
  session: number;
  houseVotesUpserted: number;
  senateVotesUpserted: number;
  memberVotesUpserted: number;
  duration: string;
  errors: Array<{ chamber: string; rollCall: number; error: string }>;
}

const BATCH_SIZE = 50;

export function buildCongressGovVoteUrl(voteDate: Date, rollCall: number): string {
  const year = voteDate.getFullYear();
  return `https://clerk.house.gov/Votes/${year}${rollCall.toString().padStart(3, "0")}`;
}

async function buildLisIdMap(db: Database): Promise<Map<string, string>> {
  const { legislators } = await import("@/db/schema");
  const results = await db
    .select({ bioguideId: legislators.bioguideId, lisId: legislators.lisId })
    .from(legislators)
    .where(eq(legislators.chamber, "senate"));

  const map = new Map<string, string>();
  for (const row of results) {
    if (row.lisId) {
      map.set(row.lisId, row.bioguideId);
    }
  }
  return map;
}

async function syncHouseVotes(
  db: Database,
  client: CongressClient,
  congress: number,
  session: number,
  errors: SyncVotesResult["errors"]
): Promise<{ votesUpserted: number; memberVotesUpserted: number }> {
  const { votes, memberVotes } = await import("@/db/schema");

  console.log(`Fetching House votes for Congress ${congress}, Session ${session}...`);

  let offset = 0;
  const limit = 250;
  let totalVotesUpserted = 0;
  let totalMemberVotesUpserted = 0;
  const allVotes: Array<{
    rollCallNumber: number;
    startDate: string;
    result?: string;
    legislationNumber?: string;
  }> = [];

  while (true) {
    const listResponse = await client.listHouseVotes(congress, session, { limit, offset });
    allVotes.push(...listResponse.houseRollCallVotes);

    if (!listResponse.pagination?.next || listResponse.houseRollCallVotes.length < limit) {
      break;
    }
    offset += limit;
  }

  console.log(`Found ${allVotes.length} House votes to sync`);

  for (let i = 0; i < allVotes.length; i++) {
    const voteItem = allVotes[i];
    try {
      const [voteDetail, membersResponse] = await Promise.all([
        client.getHouseVote(congress, session, voteItem.rollCallNumber),
        client.getHouseVoteMembers(congress, session, voteItem.rollCallNumber),
      ]);

      const voteData = voteDetail.houseRollCallVote;
      const partyTotals = voteData.votePartyTotal ?? [];

      let yeas = 0;
      let nays = 0;
      let present = 0;
      let notVoting = 0;

      for (const pt of partyTotals) {
        yeas += pt.yeaTotal;
        nays += pt.nayTotal;
        present += pt.presentTotal;
        notVoting += pt.notVotingTotal;
      }

      const voteDate = new Date(voteData.startDate);
      if (isNaN(voteDate.getTime())) {
        errors.push({
          chamber: "house",
          rollCall: voteItem.rollCallNumber,
          error: `Invalid vote date: ${voteData.startDate}`,
        });
        continue;
      }
      const sourceUrl = buildCongressGovVoteUrl(voteDate, voteItem.rollCallNumber);

      const [insertedVote] = await db
        .insert(votes)
        .values({
          rollCall: voteItem.rollCallNumber,
          chamber: "house",
          congress,
          session,
          date: voteDate,
          question: voteData.voteQuestion ?? voteData.voteType ?? "Unknown",
          result: voteData.result,
          billNumber: voteItem.legislationNumber ?? null,
          billTitle: null,
          billSubjects: null,
          sourceUrl,
          yeas,
          nays,
          notVoting,
          present,
        })
        .onConflictDoUpdate({
          target: [votes.chamber, votes.congress, votes.session, votes.rollCall],
          set: {
            date: sql`excluded.date`,
            question: sql`excluded.question`,
            result: sql`excluded.result`,
            billNumber: sql`excluded.bill_number`,
            sourceUrl: sql`excluded.source_url`,
            yeas: sql`excluded.yeas`,
            nays: sql`excluded.nays`,
            notVoting: sql`excluded.not_voting`,
            present: sql`excluded.present`,
          },
        })
        .returning({ id: votes.id });

      if (!insertedVote) {
        errors.push({
          chamber: "house",
          rollCall: voteItem.rollCallNumber,
          error: "Failed to upsert vote record",
        });
        continue;
      }

      totalVotesUpserted++;

      const memberVoteValues = membersResponse.members.map((m) => ({
        voteId: insertedVote.id,
        bioguideId: m.bioguideId,
        position: normalizeVotePosition(m.vote),
      }));

      if (memberVoteValues.length > 0) {
        for (let j = 0; j < memberVoteValues.length; j += BATCH_SIZE) {
          const batch = memberVoteValues.slice(j, j + BATCH_SIZE);
          await db
            .insert(memberVotes)
            .values(batch)
            .onConflictDoUpdate({
              target: [memberVotes.voteId, memberVotes.bioguideId],
              set: { position: sql`excluded.position` },
            });
          totalMemberVotesUpserted += batch.length;
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1} / ${allVotes.length} House votes...`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`Error syncing House vote ${voteItem.rollCallNumber}: ${message}`);
      errors.push({ chamber: "house", rollCall: voteItem.rollCallNumber, error: message });
    }
  }

  return { votesUpserted: totalVotesUpserted, memberVotesUpserted: totalMemberVotesUpserted };
}

async function syncSenateVotes(
  db: Database,
  client: SenateVoteClient,
  lisIdMap: Map<string, string>,
  congress: number,
  session: number,
  errors: SyncVotesResult["errors"]
): Promise<{ votesUpserted: number; memberVotesUpserted: number; unmappedMembers: number }> {
  const { votes, memberVotes } = await import("@/db/schema");

  console.log(`Fetching Senate votes for Congress ${congress}, Session ${session}...`);

  const menu = await client.getVoteMenu(congress, session);
  console.log(`Found ${menu.votes.length} Senate votes to sync`);

  let totalVotesUpserted = 0;
  let totalMemberVotesUpserted = 0;
  let unmappedMembers = 0;

  for (let i = 0; i < menu.votes.length; i++) {
    const voteMenuItem = menu.votes[i];
    try {
      const voteDetail = await client.getVote(congress, session, voteMenuItem.voteNumber);

      const sourceUrl = buildSenateVoteUrl(congress, session, voteMenuItem.voteNumber);

      const parsedDate = new Date(voteDetail.voteDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push({
          chamber: "senate",
          rollCall: voteMenuItem.voteNumber,
          error: `Invalid vote date: ${voteDetail.voteDate}`,
        });
        continue;
      }
      const voteDate = parsedDate;

      const [insertedVote] = await db
        .insert(votes)
        .values({
          rollCall: voteDetail.voteNumber,
          chamber: "senate",
          congress,
          session,
          date: voteDate,
          question: voteDetail.question,
          result: voteDetail.result,
          billNumber: voteDetail.documentName ?? null,
          billTitle: voteDetail.documentTitle ?? null,
          billSubjects: null,
          sourceUrl,
          yeas: voteDetail.yeas,
          nays: voteDetail.nays,
          notVoting: voteDetail.notVoting,
          present: voteDetail.present,
        })
        .onConflictDoUpdate({
          target: [votes.chamber, votes.congress, votes.session, votes.rollCall],
          set: {
            date: sql`excluded.date`,
            question: sql`excluded.question`,
            result: sql`excluded.result`,
            billNumber: sql`excluded.bill_number`,
            billTitle: sql`excluded.bill_title`,
            sourceUrl: sql`excluded.source_url`,
            yeas: sql`excluded.yeas`,
            nays: sql`excluded.nays`,
            notVoting: sql`excluded.not_voting`,
            present: sql`excluded.present`,
          },
        })
        .returning({ id: votes.id });

      if (!insertedVote) {
        errors.push({
          chamber: "senate",
          rollCall: voteMenuItem.voteNumber,
          error: "Failed to upsert vote record",
        });
        continue;
      }

      totalVotesUpserted++;

      const memberVoteValues: Array<{
        voteId: string;
        bioguideId: string;
        position: VotePosition;
      }> = [];

      for (const member of voteDetail.members) {
        const bioguideId = lisIdMap.get(member.lisMemberId);
        if (!bioguideId) {
          unmappedMembers++;
          continue;
        }
        memberVoteValues.push({
          voteId: insertedVote.id,
          bioguideId,
          position: normalizeVotePosition(member.voteCast),
        });
      }

      if (memberVoteValues.length > 0) {
        for (let j = 0; j < memberVoteValues.length; j += BATCH_SIZE) {
          const batch = memberVoteValues.slice(j, j + BATCH_SIZE);
          await db
            .insert(memberVotes)
            .values(batch)
            .onConflictDoUpdate({
              target: [memberVotes.voteId, memberVotes.bioguideId],
              set: { position: sql`excluded.position` },
            });
          totalMemberVotesUpserted += batch.length;
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1} / ${menu.votes.length} Senate votes...`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`Error syncing Senate vote ${voteMenuItem.voteNumber}: ${message}`);
      errors.push({ chamber: "senate", rollCall: voteMenuItem.voteNumber, error: message });
    }
  }

  return {
    votesUpserted: totalVotesUpserted,
    memberVotesUpserted: totalMemberVotesUpserted,
    unmappedMembers,
  };
}

export async function syncVotes(
  congressNumber?: number,
  force: boolean = false
): Promise<SyncVotesResult> {
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
  const { dataSourceMeta } = await import("@/db/schema");

  const db = createDb(databaseUrl);

  const congress = congressNumber ?? getCurrentCongress();
  const session = getCurrentSession();
  const metaId = `votes-${congress}-${session}`;

  console.log(`Syncing votes for Congress ${congress}, Session ${session}...`);

  if (!force) {
    const [existingMeta] = await db
      .select()
      .from(dataSourceMeta)
      .where(eq(dataSourceMeta.id, metaId));

    if (existingMeta?.lastChecked) {
      const hoursSinceLastSync =
        (Date.now() - existingMeta.lastChecked.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSync < 12) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
        console.log(`Skipping sync - last synced ${hoursSinceLastSync.toFixed(1)} hours ago`);
        return {
          source: "congress.gov + senate.gov",
          changed: false,
          congressNumber: congress,
          session,
          houseVotesUpserted: 0,
          senateVotesUpserted: 0,
          memberVotesUpserted: 0,
          duration,
          errors: [],
        };
      }
    }
  }

  const congressClient = createCongressClient({
    apiKey: congressApiKey,
    minDelayMs: 100,
  });

  const senateClient = createSenateVoteClient({
    minDelayMs: 200,
  });

  const lisIdMap = await buildLisIdMap(db);
  console.log(`Loaded ${lisIdMap.size} Senate LIS ID mappings`);

  const errors: SyncVotesResult["errors"] = [];

  const houseResult = await syncHouseVotes(db, congressClient, congress, session, errors);
  const senateResult = await syncSenateVotes(db, senateClient, lisIdMap, congress, session, errors);

  if (senateResult.unmappedMembers > 0) {
    console.warn(
      `Warning: ${senateResult.unmappedMembers} Senate member votes had unmapped LIS IDs`
    );
  }

  const totalVotesUpsertedForMeta = houseResult.votesUpserted + senateResult.votesUpserted;
  const hasChanges = totalVotesUpsertedForMeta > 0;

  await db
    .insert(dataSourceMeta)
    .values({
      id: metaId,
      sourceUrl: "https://api.congress.gov + https://senate.gov",
      lastChecked: new Date(),
      lastChanged: hasChanges ? new Date() : new Date(0),
      recordCount: totalVotesUpsertedForMeta,
    })
    .onConflictDoUpdate({
      target: dataSourceMeta.id,
      set: {
        lastChecked: new Date(),
        ...(hasChanges ? { lastChanged: new Date() } : {}),
        recordCount: totalVotesUpsertedForMeta,
      },
    });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

  console.log(
    `Sync complete: ${houseResult.votesUpserted} House votes, ${senateResult.votesUpserted} Senate votes`
  );

  const totalVotesUpserted = houseResult.votesUpserted + senateResult.votesUpserted;

  return {
    source: "congress.gov + senate.gov",
    changed: totalVotesUpserted > 0,
    congressNumber: congress,
    session,
    houseVotesUpserted: houseResult.votesUpserted,
    senateVotesUpserted: senateResult.votesUpserted,
    memberVotesUpserted: houseResult.memberVotesUpserted + senateResult.memberVotesUpserted,
    duration,
    errors,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes("--force");
  let congress: number | undefined;

  const congressArgIndex = process.argv.findIndex((arg) => arg === "--congress");
  if (congressArgIndex !== -1 && process.argv[congressArgIndex + 1]) {
    congress = parseInt(process.argv[congressArgIndex + 1], 10);
    if (isNaN(congress)) {
      console.error("Invalid --congress value");
      process.exit(1);
    }
  }

  if (force) {
    console.log("Force mode: bypassing time-based change detection");
  }

  syncVotes(congress, force)
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}
