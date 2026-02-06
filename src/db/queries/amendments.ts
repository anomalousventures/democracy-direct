import { eq, and, desc, count } from "drizzle-orm";
import type { Database } from "../client";
import { amendments, type Amendment, type Bill, type Legislator } from "../schema";
import type { AmendmentType } from "@/lib/types/legislation";

export type AmendmentWithRelations = Amendment & {
  sponsor: Legislator | null;
  amendedBill: Bill | null;
};

export async function getAmendmentById(
  db: Database,
  amendmentId: string
): Promise<Amendment | null> {
  const [result] = await db
    .select()
    .from(amendments)
    .where(eq(amendments.id, amendmentId))
    .limit(1);
  return result ?? null;
}

export async function getAmendmentByNumber(
  db: Database,
  congress: number,
  amendmentType: AmendmentType,
  amendmentNumber: string
): Promise<AmendmentWithRelations | null> {
  const result = await db.query.amendments.findFirst({
    where: and(
      eq(amendments.congress, congress),
      eq(amendments.amendmentType, amendmentType),
      eq(amendments.amendmentNumber, amendmentNumber)
    ),
    with: { sponsor: true, amendedBill: true },
  });
  return result ?? null;
}

export async function getAmendmentsByBill(
  db: Database,
  billId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<AmendmentWithRelations[]> {
  const { limit = 50, offset = 0 } = options;

  return db.query.amendments.findMany({
    where: eq(amendments.amendedBillId, billId),
    with: { sponsor: true, amendedBill: true },
    orderBy: desc(amendments.latestActionDate),
    limit,
    offset,
  });
}

export async function getAmendmentsByCongress(
  db: Database,
  congress: number,
  options: { limit?: number; offset?: number } = {}
): Promise<AmendmentWithRelations[]> {
  const { limit = 50, offset = 0 } = options;

  return db.query.amendments.findMany({
    where: eq(amendments.congress, congress),
    with: { sponsor: true, amendedBill: true },
    orderBy: desc(amendments.latestActionDate),
    limit,
    offset,
  });
}

export async function getAmendmentCountForBill(db: Database, billId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(amendments)
    .where(eq(amendments.amendedBillId, billId));
  return Number(result?.count ?? 0);
}
