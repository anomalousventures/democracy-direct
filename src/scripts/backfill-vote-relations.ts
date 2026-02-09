import "dotenv/config";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { createCongressClient, getCurrentCongress } from "@/lib/congress-api";
import { parseBillNumber, buildCongressGovUrl } from "@/lib/bill-utils";
import { detectAmendmentFromVote, buildAmendmentCongressGovUrl } from "@/lib/amendment-utils";
import type { BillType, Chamber, AmendmentType } from "@/lib/types/legislation";

export interface BackfillResult {
  votesProcessed: number;
  billsLinked: number;
  amendmentsLinked: number;
  errors: number;
  duration: string;
}

function inferBillStatus(
  latestActionText: string
): "introduced" | "passed_house" | "passed_senate" {
  const lowerText = latestActionText.toLowerCase();
  if (lowerText.includes("passed house")) return "passed_house";
  if (lowerText.includes("passed senate")) return "passed_senate";
  return "introduced";
}

export async function backfillVoteRelations(congress?: number): Promise<BackfillResult> {
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
  const { votes, bills, amendments } = await import("@/db/schema");

  const db = createDb(databaseUrl);
  const targetCongress = congress ?? getCurrentCongress();

  const client = createCongressClient({
    apiKey: congressApiKey,
    minDelayMs: 100,
  });

  let votesProcessed = 0;
  let billsLinked = 0;
  let amendmentsLinked = 0;
  let errors = 0;

  console.log(`Backfilling vote relations for Congress ${targetCongress}...`);

  const votesNeedingBillLink = await db
    .select({
      id: votes.id,
      congress: votes.congress,
      billNumber: votes.billNumber,
      question: votes.question,
      legislationType: votes.legislationType,
    })
    .from(votes)
    .where(
      and(eq(votes.congress, targetCongress), isNull(votes.billId), isNotNull(votes.billNumber))
    );

  console.log(`Found ${votesNeedingBillLink.length} votes needing bill/amendment linking`);

  for (const vote of votesNeedingBillLink) {
    votesProcessed++;

    try {
      const amendmentRef = detectAmendmentFromVote(
        vote.question,
        vote.billNumber,
        vote.legislationType
      );

      if (amendmentRef) {
        const existing = await db
          .select({ id: amendments.id })
          .from(amendments)
          .where(
            and(
              eq(amendments.congress, vote.congress),
              eq(amendments.amendmentType, amendmentRef.type),
              eq(amendments.amendmentNumber, amendmentRef.number.toString())
            )
          )
          .limit(1);

        let amendmentId = existing[0]?.id ?? null;

        if (!amendmentId) {
          try {
            const detail = await client.getAmendment(
              vote.congress,
              amendmentRef.type,
              amendmentRef.number.toString()
            );
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

            const chamber: Chamber = amendmentRef.type === "hamdt" ? "house" : "senate";

            const [inserted] = await db
              .insert(amendments)
              .values({
                amendmentNumber: amendmentRef.number.toString(),
                amendmentType: amendmentRef.type as AmendmentType,
                congress: vote.congress,
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
                  vote.congress,
                  amendmentRef.type,
                  amendmentRef.number
                ),
              })
              .onConflictDoNothing()
              .returning({ id: amendments.id });

            amendmentId = inserted?.id ?? null;

            if (!amendmentId) {
              const refetch = await db
                .select({ id: amendments.id })
                .from(amendments)
                .where(
                  and(
                    eq(amendments.congress, vote.congress),
                    eq(amendments.amendmentType, amendmentRef.type),
                    eq(amendments.amendmentNumber, amendmentRef.number.toString())
                  )
                )
                .limit(1);
              amendmentId = refetch[0]?.id ?? null;
            }
          } catch {
            console.warn(`Failed to fetch amendment ${amendmentRef.type}${amendmentRef.number}`);
          }
        }

        if (amendmentId) {
          await db.update(votes).set({ amendmentId }).where(eq(votes.id, vote.id));
          amendmentsLinked++;
        }

        continue;
      }

      const parsed = parseBillNumber(vote.billNumber!);
      if (!parsed) continue;

      const existingBill = await db
        .select({ id: bills.id })
        .from(bills)
        .where(
          and(
            eq(bills.congress, vote.congress),
            eq(bills.billType, parsed.type),
            eq(bills.billNumber, parsed.number.toString())
          )
        )
        .limit(1);

      let billId = existingBill[0]?.id ?? null;

      if (!billId) {
        try {
          const detail = await client.getBill(vote.congress, parsed.type, parsed.number);
          const bill = detail.bill;

          const [inserted] = await db
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
              congressGovUrl: buildCongressGovUrl(vote.congress, parsed.type, parsed.number),
            })
            .onConflictDoNothing()
            .returning({ id: bills.id });

          billId = inserted?.id ?? null;

          if (!billId) {
            const refetch = await db
              .select({ id: bills.id })
              .from(bills)
              .where(
                and(
                  eq(bills.congress, vote.congress),
                  eq(bills.billType, parsed.type),
                  eq(bills.billNumber, parsed.number.toString())
                )
              )
              .limit(1);
            billId = refetch[0]?.id ?? null;
          }
        } catch {
          console.warn(`Failed to fetch bill ${parsed.type}${parsed.number}`);
        }
      }

      if (billId) {
        await db.update(votes).set({ billId }).where(eq(votes.id, vote.id));
        billsLinked++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`Error processing vote ${vote.id}: ${message}`);
      errors++;
    }

    if (votesProcessed % 50 === 0) {
      console.log(`Processed ${votesProcessed}/${votesNeedingBillLink.length} votes...`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

  console.log(
    `Backfill complete: ${billsLinked} bills linked, ${amendmentsLinked} amendments linked, ${errors} errors`
  );

  return {
    votesProcessed,
    billsLinked,
    amendmentsLinked,
    errors,
    duration,
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

  backfillVoteRelations(congress)
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Backfill failed:", error);
      process.exit(1);
    });
}
