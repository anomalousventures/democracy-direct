import { eq, and, desc, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Database } from "../client";
import { bills, legislators, type Bill } from "../schema";
import type { BillStatus, BillType } from "@/lib/types/legislation";
export type { BillType };

export interface BillWithSponsor extends Bill {
  sponsorName: string | null;
  sponsorParty: string | null;
  sponsorState: string | null;
}

const billWithSponsorSelect = {
  id: bills.id,
  billNumber: bills.billNumber,
  billType: bills.billType,
  congress: bills.congress,
  title: bills.title,
  summary: bills.summary,
  status: bills.status,
  subjects: bills.subjects,
  introducedDate: bills.introducedDate,
  latestActionDate: bills.latestActionDate,
  latestActionText: bills.latestActionText,
  sponsorBioguideId: bills.sponsorBioguideId,
  congressGovUrl: bills.congressGovUrl,
  createdAt: bills.createdAt,
  updatedAt: bills.updatedAt,
  sponsorName: legislators.fullName,
  sponsorParty: legislators.party,
  sponsorState: legislators.state,
} as const;

function buildCongressStatusConditions(congress?: number, status?: BillStatus): SQL[] {
  const conditions: SQL[] = [];
  if (congress) {
    conditions.push(eq(bills.congress, congress));
  }
  if (status) {
    conditions.push(eq(bills.status, status));
  }
  return conditions;
}

export interface GetBillsByMemberOptions {
  limit?: number;
  offset?: number;
  congress?: number;
  status?: BillStatus;
}

export async function getBillById(db: Database, billId: string): Promise<Bill | null> {
  const results = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
  return results[0] ?? null;
}

export async function getBillByNumber(
  db: Database,
  congress: number,
  billType: BillType,
  billNumber: string
): Promise<BillWithSponsor | null> {
  const results = await db
    .select(billWithSponsorSelect)
    .from(bills)
    .leftJoin(legislators, eq(bills.sponsorBioguideId, legislators.bioguideId))
    .where(
      and(
        eq(bills.congress, congress),
        eq(bills.billType, billType),
        eq(bills.billNumber, billNumber)
      )
    )
    .limit(1);

  return results[0] ?? null;
}

export async function getBillsByMember(
  db: Database,
  bioguideId: string,
  options: GetBillsByMemberOptions = {}
): Promise<Bill[]> {
  const { limit = 50, offset = 0, congress, status } = options;

  const conditions = [
    eq(bills.sponsorBioguideId, bioguideId),
    ...buildCongressStatusConditions(congress, status),
  ];

  return db
    .select()
    .from(bills)
    .where(and(...conditions))
    .orderBy(desc(bills.latestActionDate))
    .limit(limit)
    .offset(offset);
}

export async function getBillCountByMember(
  db: Database,
  bioguideId: string,
  congress?: number
): Promise<number> {
  const conditions = [eq(bills.sponsorBioguideId, bioguideId)];

  if (congress) {
    conditions.push(eq(bills.congress, congress));
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bills)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}

export interface SearchBillsOptions {
  limit?: number;
  offset?: number;
  congress?: number;
  status?: BillStatus;
  subject?: string;
}

/**
 * Search bills by bill number or title.
 *
 * Performance note: ILIKE with wildcards requires a full table scan. This is
 * acceptable for the current dataset size. For larger datasets, consider adding
 * a GIN index with pg_trgm or using PostgreSQL full-text search.
 */
export async function searchBills(
  db: Database,
  query: string,
  options: SearchBillsOptions = {}
): Promise<BillWithSponsor[]> {
  const { limit = 50, offset = 0, congress, status, subject } = options;

  const searchPattern = `%${query}%`;
  const conditions: SQL[] = [
    or(ilike(bills.billNumber, searchPattern), ilike(bills.title, searchPattern))!,
    ...buildCongressStatusConditions(congress, status),
  ];

  if (subject) {
    conditions.push(sql`${bills.subjects}::jsonb @> ${JSON.stringify([subject])}::jsonb`);
  }

  return db
    .select(billWithSponsorSelect)
    .from(bills)
    .leftJoin(legislators, eq(bills.sponsorBioguideId, legislators.bioguideId))
    .where(and(...conditions))
    .orderBy(desc(bills.latestActionDate))
    .limit(limit)
    .offset(offset);
}

export async function getBillsBySubject(
  db: Database,
  subject: string,
  options: Omit<SearchBillsOptions, "subject"> = {}
): Promise<BillWithSponsor[]> {
  const { limit = 50, offset = 0, congress, status } = options;

  const conditions: SQL[] = [
    sql`${bills.subjects}::jsonb @> ${JSON.stringify([subject])}::jsonb`,
    ...buildCongressStatusConditions(congress, status),
  ];

  return db
    .select(billWithSponsorSelect)
    .from(bills)
    .leftJoin(legislators, eq(bills.sponsorBioguideId, legislators.bioguideId))
    .where(and(...conditions))
    .orderBy(desc(bills.latestActionDate))
    .limit(limit)
    .offset(offset);
}

export interface GetBillsOptions {
  limit?: number;
  offset?: number;
  congress?: number;
  status?: BillStatus;
}

export async function getBills(
  db: Database,
  options: GetBillsOptions = {}
): Promise<BillWithSponsor[]> {
  const { limit = 50, offset = 0, congress, status } = options;

  const conditions = buildCongressStatusConditions(congress, status);

  return db
    .select(billWithSponsorSelect)
    .from(bills)
    .leftJoin(legislators, eq(bills.sponsorBioguideId, legislators.bioguideId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bills.latestActionDate))
    .limit(limit)
    .offset(offset);
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

export interface BillCountOptions {
  congress?: number;
  status?: BillStatus;
  subject?: string;
  billType?: BillType;
  query?: string;
}

export async function getBillCount(db: Database, options: BillCountOptions = {}): Promise<number> {
  const { congress, status, subject, billType, query } = options;

  const conditions: SQL[] = [];

  if (congress) {
    conditions.push(eq(bills.congress, congress));
  }
  if (status) {
    conditions.push(eq(bills.status, status));
  }
  if (billType) {
    conditions.push(eq(bills.billType, billType));
  }
  if (subject) {
    conditions.push(sql`${bills.subjects}::jsonb @> ${JSON.stringify([subject])}::jsonb`);
  }
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(or(ilike(bills.billNumber, searchPattern), ilike(bills.title, searchPattern))!);
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bills)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result[0]?.count ?? 0;
}
