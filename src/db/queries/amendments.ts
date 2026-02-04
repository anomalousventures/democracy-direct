import { eq, and, desc } from "drizzle-orm";
import type { Database } from "../client";
import { amendments, bills, legislators, type Amendment } from "../schema";
import type { AmendmentType } from "@/lib/types/legislation";

export interface AmendmentWithRelations extends Amendment {
  sponsorName: string | null;
  sponsorParty: string | null;
  sponsorState: string | null;
  amendedBillNumber: string | null;
  amendedBillTitle: string | null;
}

const amendmentWithRelationsSelect = {
  id: amendments.id,
  amendmentNumber: amendments.amendmentNumber,
  amendmentType: amendments.amendmentType,
  congress: amendments.congress,
  chamber: amendments.chamber,
  description: amendments.description,
  purpose: amendments.purpose,
  latestActionDate: amendments.latestActionDate,
  latestActionText: amendments.latestActionText,
  sponsorBioguideId: amendments.sponsorBioguideId,
  amendedBillId: amendments.amendedBillId,
  congressGovUrl: amendments.congressGovUrl,
  createdAt: amendments.createdAt,
  updatedAt: amendments.updatedAt,
  sponsorName: legislators.fullName,
  sponsorParty: legislators.party,
  sponsorState: legislators.state,
  amendedBillNumber: bills.billNumber,
  amendedBillTitle: bills.title,
} as const;

export async function getAmendmentById(
  db: Database,
  amendmentId: string
): Promise<Amendment | null> {
  const results = await db.select().from(amendments).where(eq(amendments.id, amendmentId)).limit(1);
  return results[0] ?? null;
}

export async function getAmendmentByNumber(
  db: Database,
  congress: number,
  amendmentType: AmendmentType,
  amendmentNumber: string
): Promise<AmendmentWithRelations | null> {
  const results = await db
    .select(amendmentWithRelationsSelect)
    .from(amendments)
    .leftJoin(legislators, eq(amendments.sponsorBioguideId, legislators.bioguideId))
    .leftJoin(bills, eq(amendments.amendedBillId, bills.id))
    .where(
      and(
        eq(amendments.congress, congress),
        eq(amendments.amendmentType, amendmentType),
        eq(amendments.amendmentNumber, amendmentNumber)
      )
    )
    .limit(1);

  return results[0] ?? null;
}

export async function getAmendmentsByBill(
  db: Database,
  billId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<AmendmentWithRelations[]> {
  const { limit = 50, offset = 0 } = options;

  return db
    .select(amendmentWithRelationsSelect)
    .from(amendments)
    .leftJoin(legislators, eq(amendments.sponsorBioguideId, legislators.bioguideId))
    .leftJoin(bills, eq(amendments.amendedBillId, bills.id))
    .where(eq(amendments.amendedBillId, billId))
    .orderBy(desc(amendments.latestActionDate))
    .limit(limit)
    .offset(offset);
}

export async function getAmendmentsByCongress(
  db: Database,
  congress: number,
  options: { limit?: number; offset?: number } = {}
): Promise<AmendmentWithRelations[]> {
  const { limit = 50, offset = 0 } = options;

  return db
    .select(amendmentWithRelationsSelect)
    .from(amendments)
    .leftJoin(legislators, eq(amendments.sponsorBioguideId, legislators.bioguideId))
    .leftJoin(bills, eq(amendments.amendedBillId, bills.id))
    .where(eq(amendments.congress, congress))
    .orderBy(desc(amendments.latestActionDate))
    .limit(limit)
    .offset(offset);
}
