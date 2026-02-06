import { eq, and, desc, ilike, or, sql, isNull, count, type SQL } from "drizzle-orm";
import type { Database } from "../client";
import { bills, type Bill, type Legislator } from "../schema";
import type { BillStatus, BillType } from "@/lib/types/legislation";
export type { BillType };

export type BillWithSponsor = Bill & { sponsor: Legislator | null };

export interface BillFilterOptions {
  congress?: number;
  status?: BillStatus;
  billType?: BillType;
  subject?: string;
  query?: string;
  bioguideId?: string;
}

const conditionBuilders: {
  [K in keyof Required<BillFilterOptions>]: (options: BillFilterOptions) => SQL | undefined;
} = {
  congress: (o) => (o.congress ? eq(bills.congress, o.congress) : undefined),
  status: (o) => (o.status ? eq(bills.status, o.status) : undefined),
  billType: (o) => (o.billType ? eq(bills.billType, o.billType) : undefined),
  bioguideId: (o) => (o.bioguideId ? eq(bills.sponsorBioguideId, o.bioguideId) : undefined),
  subject: (o) =>
    o.subject ? sql`${bills.subjects}::jsonb @> ${JSON.stringify([o.subject])}::jsonb` : undefined,
  query: (o) => {
    if (!o.query) return undefined;
    const p = `%${o.query}%`;
    return or(ilike(bills.billNumber, p), ilike(bills.title, p))!;
  },
};

function buildBillConditions(options: BillFilterOptions): SQL[] {
  return Object.values(conditionBuilders)
    .map((builder) => builder(options))
    .filter((c): c is SQL => c !== undefined);
}

function combineConditions(conditions: SQL[]): SQL | undefined {
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export interface GetBillsByMemberOptions {
  limit?: number;
  offset?: number;
  congress?: number;
  status?: BillStatus;
}

export async function getBillById(db: Database, billId: string): Promise<Bill | null> {
  const [result] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
  return result ?? null;
}

export async function getBillByNumber(
  db: Database,
  congress: number,
  billType: BillType,
  billNumber: string
): Promise<BillWithSponsor | null> {
  const result = await db.query.bills.findFirst({
    where: and(
      eq(bills.congress, congress),
      eq(bills.billType, billType),
      eq(bills.billNumber, billNumber)
    ),
    with: { sponsor: true },
  });
  return result ?? null;
}

export async function getBillsByMember(
  db: Database,
  bioguideId: string,
  options: GetBillsByMemberOptions = {}
): Promise<Bill[]> {
  const { limit = 50, offset = 0, congress, status } = options;
  const conditions = buildBillConditions({ bioguideId, congress, status });

  return db
    .select()
    .from(bills)
    .where(combineConditions(conditions))
    .orderBy(desc(bills.latestActionDate))
    .limit(limit)
    .offset(offset);
}

export async function getBillCount(db: Database, options: BillFilterOptions = {}): Promise<number> {
  const conditions = buildBillConditions(options);
  const [result] = await db
    .select({ count: count() })
    .from(bills)
    .where(combineConditions(conditions));
  return Number(result?.count ?? 0);
}

export interface SearchBillsOptions {
  limit?: number;
  offset?: number;
  congress?: number;
  status?: BillStatus;
  billType?: BillType;
  subject?: string;
}

/**
 * Performance note: ILIKE with wildcards requires a full table scan. This is
 * acceptable for the current dataset size. For larger datasets, consider adding
 * a GIN index with pg_trgm or using PostgreSQL full-text search.
 */
export async function searchBills(
  db: Database,
  query: string,
  options: SearchBillsOptions = {}
): Promise<BillWithSponsor[]> {
  const { limit = 50, offset = 0, ...filters } = options;
  const conditions = buildBillConditions({ ...filters, query });

  return db.query.bills.findMany({
    where: combineConditions(conditions),
    with: { sponsor: true },
    orderBy: desc(bills.latestActionDate),
    limit,
    offset,
  });
}

export async function getBillsBySubject(
  db: Database,
  subject: string,
  options: Omit<SearchBillsOptions, "subject"> = {}
): Promise<BillWithSponsor[]> {
  const { limit = 50, offset = 0, ...filters } = options;
  const conditions = buildBillConditions({ ...filters, subject });

  return db.query.bills.findMany({
    where: combineConditions(conditions),
    with: { sponsor: true },
    orderBy: desc(bills.latestActionDate),
    limit,
    offset,
  });
}

export async function getBills(
  db: Database,
  options: SearchBillsOptions = {}
): Promise<BillWithSponsor[]> {
  const { limit = 50, offset = 0, ...filters } = options;
  const conditions = buildBillConditions(filters);

  return db.query.bills.findMany({
    where: combineConditions(conditions),
    with: { sponsor: true },
    orderBy: desc(bills.latestActionDate),
    limit,
    offset,
  });
}

export async function getDistinctSubjects(db: Database, congress?: number): Promise<string[]> {
  const whereClause = congress !== undefined ? sql`WHERE ${bills.congress} = ${congress}` : sql``;

  const result = await db.execute(sql<{ subject: string }>`
    SELECT DISTINCT subject
    FROM ${bills}
    CROSS JOIN LATERAL jsonb_array_elements_text(${bills.subjects}) AS subject
    ${whereClause}
    ORDER BY subject
  `);

  return (result.rows as Array<{ subject: string }>).map((row) => row.subject);
}

export interface BillForSummarySync {
  id: string;
  congress: number;
  billType: BillType;
  billNumber: string;
}

export async function getBillsWithoutSummary(
  db: Database,
  limit: number = 100
): Promise<BillForSummarySync[]> {
  return db
    .select({
      id: bills.id,
      congress: bills.congress,
      billType: bills.billType,
      billNumber: bills.billNumber,
    })
    .from(bills)
    .where(isNull(bills.summary))
    .orderBy(desc(bills.latestActionDate))
    .limit(limit);
}

export async function updateBillSummary(
  db: Database,
  billId: string,
  summary: string
): Promise<void> {
  await db.update(bills).set({ summary, updatedAt: new Date() }).where(eq(bills.id, billId));
}
