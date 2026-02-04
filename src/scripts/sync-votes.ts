import "dotenv/config";
import { eq, sql, and } from "drizzle-orm";
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
import { parseBillNumber, buildCongressGovUrl } from "@/lib/bill-utils";
import { detectAmendmentFromVote, buildAmendmentCongressGovUrl } from "@/lib/amendment-utils";
import type { Database } from "@/db/client";
import type { VotePosition, BillType, Chamber, AmendmentType } from "@/lib/types/legislation";

export interface SyncVotesResult {
  source: "congress.gov + senate.gov";
  changed: boolean;
  congressNumber: number;
  session: number;
  houseVotesUpserted: number;
  senateVotesUpserted: number;
  memberVotesUpserted: number;
  unmappedSenateMembers: number;
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

function inferBillStatus(
  latestActionText: string
): "introduced" | "passed_house" | "passed_senate" {
  const lowerText = latestActionText.toLowerCase();
  if (lowerText.includes("passed house")) return "passed_house";
  if (lowerText.includes("passed senate")) return "passed_senate";
  return "introduced";
}

async function resolveBillId(
  db: Database,
  client: CongressClient,
  congress: number,
  billNumber: string | null,
  legislationType: string | null
): Promise<string | null> {
  if (!billNumber || legislationType === "AMENDMENT") return null;

  const parsed = parseBillNumber(billNumber);
  if (!parsed) return null;

  const { bills } = await import("@/db/schema");

  const existing = await db
    .select({ id: bills.id })
    .from(bills)
    .where(
      and(
        eq(bills.congress, congress),
        eq(bills.billType, parsed.type),
        eq(bills.billNumber, parsed.number.toString())
      )
    )
    .limit(1);

  if (existing[0]) return existing[0].id;

  try {
    const detail = await client.getBill(congress, parsed.type, parsed.number);
    const bill = detail.bill;

    const [insertedBill] = await db
      .insert(bills)
      .values({
        billNumber: bill.number.toString(),
        billType: bill.type.toLowerCase() as BillType,
        congress: bill.congress,
        title: bill.title,
        summary: null,
        status: inferBillStatus(bill.latestAction?.text ?? ""),
        subjects: [],
        introducedDate: new Date(bill.introducedDate ?? Date.now()),
        latestActionDate: new Date(bill.latestAction?.actionDate ?? Date.now()),
        latestActionText: bill.latestAction?.text ?? "Introduced",
        sponsorBioguideId: bill.sponsors?.[0]?.bioguideId ?? null,
        congressGovUrl: buildCongressGovUrl(congress, parsed.type, parsed.number),
      })
      .onConflictDoNothing()
      .returning({ id: bills.id });

    if (insertedBill) {
      return insertedBill.id;
    }

    const refetch = await db
      .select({ id: bills.id })
      .from(bills)
      .where(
        and(
          eq(bills.congress, congress),
          eq(bills.billType, parsed.type),
          eq(bills.billNumber, parsed.number.toString())
        )
      )
      .limit(1);

    return refetch[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function resolveAmendmentId(
  db: Database,
  client: CongressClient,
  congress: number,
  question: string,
  billNumber: string | null,
  legislationType: string | null
): Promise<string | null> {
  const parsed = detectAmendmentFromVote(question, billNumber, legislationType);
  if (!parsed) return null;

  const { amendments, bills } = await import("@/db/schema");

  const existing = await db
    .select({ id: amendments.id })
    .from(amendments)
    .where(
      and(
        eq(amendments.congress, congress),
        eq(amendments.amendmentType, parsed.type),
        eq(amendments.amendmentNumber, parsed.number.toString())
      )
    )
    .limit(1);

  if (existing[0]) return existing[0].id;

  try {
    const detail = await client.getAmendment(congress, parsed.type, parsed.number.toString());
    const amendment = detail.amendment;

    let amendedBillId: string | null = null;
    if (amendment.amendedBill) {
      const billType = amendment.amendedBill.type.toLowerCase() as BillType;
      const existingBill = await db
        .select({ id: bills.id })
        .from(bills)
        .where(
          and(
            eq(bills.congress, amendment.amendedBill.congress),
            eq(bills.billType, billType),
            eq(bills.billNumber, amendment.amendedBill.number.toString())
          )
        )
        .limit(1);

      amendedBillId = existingBill[0]?.id ?? null;
    }

    const chamber: Chamber = parsed.type === "hamdt" ? "house" : "senate";

    const [insertedAmendment] = await db
      .insert(amendments)
      .values({
        amendmentNumber: parsed.number.toString(),
        amendmentType: parsed.type as AmendmentType,
        congress,
        chamber,
        description: amendment.description ?? null,
        purpose: amendment.purpose ?? null,
        latestActionDate: amendment.latestAction?.actionDate
          ? new Date(amendment.latestAction.actionDate)
          : null,
        latestActionText: amendment.latestAction?.text ?? null,
        sponsorBioguideId: amendment.sponsors?.[0]?.bioguideId ?? null,
        amendedBillId,
        congressGovUrl: buildAmendmentCongressGovUrl(congress, parsed.type, parsed.number),
      })
      .onConflictDoNothing()
      .returning({ id: amendments.id });

    if (insertedAmendment) {
      return insertedAmendment.id;
    }

    const refetch = await db
      .select({ id: amendments.id })
      .from(amendments)
      .where(
        and(
          eq(amendments.congress, congress),
          eq(amendments.amendmentType, parsed.type),
          eq(amendments.amendmentNumber, parsed.number.toString())
        )
      )
      .limit(1);

    return refetch[0]?.id ?? null;
  } catch (error) {
    console.warn(`Failed to fetch amendment ${parsed.type}${parsed.number}: ${error}`);
    return null;
  }
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
    legislationType?: string;
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

      const question = voteData.voteQuestion ?? voteData.voteType ?? "Unknown";
      const legislationType = voteItem.legislationType ?? null;
      const billNumber = voteItem.legislationNumber ?? null;

      const billId = await resolveBillId(db, client, congress, billNumber, legislationType);
      const amendmentId = await resolveAmendmentId(
        db,
        client,
        congress,
        question,
        billNumber,
        legislationType
      );

      const [insertedVote] = await db
        .insert(votes)
        .values({
          rollCall: voteItem.rollCallNumber,
          chamber: "house",
          congress,
          session,
          date: voteDate,
          question,
          result: voteData.result,
          billNumber,
          billTitle: null,
          billSubjects: null,
          billId,
          amendmentId,
          legislationType,
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
            billId: sql`excluded.bill_id`,
            amendmentId: sql`excluded.amendment_id`,
            legislationType: sql`excluded.legislation_type`,
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
  senateClient: SenateVoteClient,
  congressClient: CongressClient,
  lisIdMap: Map<string, string>,
  congress: number,
  session: number,
  errors: SyncVotesResult["errors"]
): Promise<{ votesUpserted: number; memberVotesUpserted: number; unmappedMembers: number }> {
  const { votes, memberVotes, bills } = await import("@/db/schema");

  console.log(`Fetching Senate votes for Congress ${congress}, Session ${session}...`);

  const menu = await senateClient.getVoteMenu(congress, session);
  console.log(`Found ${menu.votes.length} Senate votes to sync`);

  let totalVotesUpserted = 0;
  let totalMemberVotesUpserted = 0;
  let unmappedMembers = 0;

  for (let i = 0; i < menu.votes.length; i++) {
    const voteMenuItem = menu.votes[i];
    try {
      const voteDetail = await senateClient.getVote(congress, session, voteMenuItem.voteNumber);

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

      const question = voteDetail.question;
      const billNumber = voteDetail.documentName ?? null;

      const billId = await resolveBillId(db, congressClient, congress, billNumber, null);
      const amendmentId = await resolveAmendmentId(
        db,
        congressClient,
        congress,
        question,
        billNumber,
        null
      );

      let billTitle = voteDetail.documentTitle ?? null;
      if (billId) {
        const bill = await db
          .select({ title: bills.title })
          .from(bills)
          .where(eq(bills.id, billId))
          .limit(1);
        billTitle = bill[0]?.title ?? billTitle;
      }

      const [insertedVote] = await db
        .insert(votes)
        .values({
          rollCall: voteDetail.voteNumber,
          chamber: "senate",
          congress,
          session,
          date: voteDate,
          question,
          result: voteDetail.result,
          billNumber,
          billTitle,
          billSubjects: null,
          billId,
          amendmentId,
          legislationType: null,
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
            billId: sql`excluded.bill_id`,
            amendmentId: sql`excluded.amendment_id`,
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
          unmappedSenateMembers: 0,
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
  const senateResult = await syncSenateVotes(
    db,
    senateClient,
    congressClient,
    lisIdMap,
    congress,
    session,
    errors
  );

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
      lastChanged: hasChanges ? new Date() : null,
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

  return {
    source: "congress.gov + senate.gov",
    changed: hasChanges,
    congressNumber: congress,
    session,
    houseVotesUpserted: houseResult.votesUpserted,
    senateVotesUpserted: senateResult.votesUpserted,
    memberVotesUpserted: houseResult.memberVotesUpserted + senateResult.memberVotesUpserted,
    unmappedSenateMembers: senateResult.unmappedMembers,
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
