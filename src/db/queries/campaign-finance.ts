import { eq, and, desc } from "drizzle-orm";
import type { Database } from "../client";
import { campaignFinance, pacContributions, independentExpenditures, committees } from "../schema";

export async function getFinanceByMember(db: Database, bioguideId: string) {
  return (
    (await db.query.campaignFinance.findFirst({
      where: eq(campaignFinance.bioguideId, bioguideId),
      orderBy: desc(campaignFinance.cycle),
    })) ?? null
  );
}

export async function getTopPacDonors(
  db: Database,
  bioguideId: string,
  options?: { cycle?: string; limit?: number }
) {
  const limit = options?.limit ?? 5;

  return db.query.pacContributions.findMany({
    where: options?.cycle
      ? and(eq(pacContributions.bioguideId, bioguideId), eq(pacContributions.cycle, options.cycle))
      : eq(pacContributions.bioguideId, bioguideId),
    with: { committee: true },
    orderBy: desc(pacContributions.totalAmount),
    limit,
  });
}

export async function getAllPacDonors(
  db: Database,
  bioguideId: string,
  cycle: string,
  options?: { limit?: number; offset?: number }
) {
  const limit = options?.limit ?? 50;

  return db.query.pacContributions.findMany({
    where: and(eq(pacContributions.bioguideId, bioguideId), eq(pacContributions.cycle, cycle)),
    with: { committee: true },
    orderBy: desc(pacContributions.totalAmount),
    limit,
    offset: options?.offset,
  });
}

export async function getIndependentExpenditures(db: Database, bioguideId: string, cycle: string) {
  return db.query.independentExpenditures.findMany({
    where: and(
      eq(independentExpenditures.bioguideId, bioguideId),
      eq(independentExpenditures.cycle, cycle)
    ),
    with: { committee: true },
    orderBy: desc(independentExpenditures.totalAmount),
  });
}

export async function getCommitteeById(db: Database, committeeId: string) {
  return (
    (await db.query.committees.findFirst({
      where: eq(committees.fecCommitteeId, committeeId),
    })) ?? null
  );
}

export async function getCommitteeContributions(db: Database, committeeId: string, cycle: string) {
  return db.query.pacContributions.findMany({
    where: and(eq(pacContributions.committeeId, committeeId), eq(pacContributions.cycle, cycle)),
    with: { legislator: true },
    orderBy: desc(pacContributions.totalAmount),
  });
}

export async function getCommitteeExpenditures(db: Database, committeeId: string, cycle: string) {
  return db.query.independentExpenditures.findMany({
    where: and(
      eq(independentExpenditures.committeeId, committeeId),
      eq(independentExpenditures.cycle, cycle)
    ),
    with: { legislator: true },
    orderBy: desc(independentExpenditures.totalAmount),
  });
}

export type CampaignFinanceData = NonNullable<Awaited<ReturnType<typeof getFinanceByMember>>>;
export type TopPacDonor = Awaited<ReturnType<typeof getTopPacDonors>>[number];
export type IndependentExpenditureWithCommittee = Awaited<
  ReturnType<typeof getIndependentExpenditures>
>[number];
export type CommitteeContribution = Awaited<ReturnType<typeof getCommitteeContributions>>[number];
export type CommitteeExpenditure = Awaited<ReturnType<typeof getCommitteeExpenditures>>[number];
