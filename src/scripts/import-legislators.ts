import "dotenv/config";
import YAML from "yaml";
import { eq, sql } from "drizzle-orm";

export interface ImportResult {
  source: "github";
  changed: boolean;
  recordsProcessed: number;
  recordsUpserted: number;
  duration: string;
  commitSha: string | null;
}

export interface RawLegislatorId {
  bioguide: string;
  thomas?: string;
  govtrack?: number;
  opensecrets?: string;
  votesmart?: number;
  fec?: string[];
  wikipedia?: string;
  ballotpedia?: string;
  google_entity_id?: string;
}

export interface RawLegislatorName {
  first: string;
  middle?: string;
  last: string;
  suffix?: string;
  nickname?: string;
  official_full?: string;
}

export interface RawLegislatorBio {
  birthday?: string;
  gender?: string;
  religion?: string;
}

export interface RawLegislatorTerm {
  type: "sen" | "rep";
  start: string;
  end: string;
  state: string;
  district?: number;
  class?: number;
  state_rank?: string;
  party: string;
  caucus?: string;
  url?: string;
  rss_url?: string;
  contact_form?: string;
  address?: string;
  office?: string;
  phone?: string;
  fax?: string;
}

export interface RawLegislatorSocial {
  twitter?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
}

export interface RawLegislator {
  id: RawLegislatorId;
  name: RawLegislatorName;
  bio: RawLegislatorBio;
  terms: RawLegislatorTerm[];
  social?: RawLegislatorSocial;
}

export interface TransformedLegislator {
  bioguideId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  party: string;
  state: string;
  district: string | null;
  chamber: string;
  title: string;
  termStart: string | null;
  termEnd: string | null;
  phoneCapitol: string | null;
  phoneDistrict: string | null;
  fax: string | null;
  addressCapitol: string | null;
  addressDistrict: string | null;
  contactFormUrl: string | null;
  website: string | null;
  twitterHandle: string | null;
  facebookId: string | null;
  youtubeId: string | null;
}

export function validateRawLegislator(data: unknown, index: number): data is RawLegislator {
  const leg = data as RawLegislator;
  const errors: string[] = [];

  if (!leg.id?.bioguide || typeof leg.id.bioguide !== "string") {
    errors.push("missing or invalid id.bioguide");
  }
  if (!leg.name?.first || typeof leg.name.first !== "string") {
    errors.push("missing or invalid name.first");
  }
  if (!leg.name?.last || typeof leg.name.last !== "string") {
    errors.push("missing or invalid name.last");
  }
  if (!Array.isArray(leg.terms) || leg.terms.length === 0) {
    errors.push("missing or empty terms array");
  } else {
    const currentTerm = leg.terms[leg.terms.length - 1];
    if (!currentTerm.type || !["sen", "rep"].includes(currentTerm.type)) {
      errors.push("invalid term type");
    }
    if (!currentTerm.state || typeof currentTerm.state !== "string") {
      errors.push("missing term state");
    }
    if (!currentTerm.party || typeof currentTerm.party !== "string") {
      errors.push("missing term party");
    }
  }

  if (errors.length > 0) {
    console.warn(
      `Validation warnings for legislator at index ${index} (${leg.id?.bioguide || "unknown"}): ${errors.join(", ")}`
    );
    return false;
  }
  return true;
}

export function parseLegislatorYaml(yamlContent: string): RawLegislator[] {
  const parsed = YAML.parse(yamlContent);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected YAML to parse to an array");
  }

  const valid: RawLegislator[] = [];
  const invalid: number[] = [];

  for (let i = 0; i < parsed.length; i++) {
    if (validateRawLegislator(parsed[i], i)) {
      valid.push(parsed[i]);
    } else {
      invalid.push(i);
    }
  }

  if (invalid.length > 0) {
    console.warn(`Skipped ${invalid.length} invalid entries`);
  }

  return valid;
}

export function transformLegislator(raw: RawLegislator): TransformedLegislator {
  const currentTerm = raw.terms[raw.terms.length - 1];

  const fullName =
    raw.name.official_full ||
    `${raw.name.first}${raw.name.middle ? " " + raw.name.middle : ""} ${raw.name.last}${raw.name.suffix ? " " + raw.name.suffix : ""}`.trim();

  const chamber = currentTerm.type === "sen" ? "senate" : "house";
  const title =
    currentTerm.type === "sen"
      ? currentTerm.state_rank === "senior"
        ? "Senior Senator"
        : "Junior Senator"
      : "Representative";

  return {
    bioguideId: raw.id.bioguide,
    firstName: raw.name.first,
    lastName: raw.name.last,
    fullName,
    party: currentTerm.party,
    state: currentTerm.state,
    district: currentTerm.district?.toString() ?? null,
    chamber,
    title,
    termStart: currentTerm.start ?? null,
    termEnd: currentTerm.end ?? null,
    phoneCapitol: currentTerm.phone ?? null,
    phoneDistrict: null,
    fax: currentTerm.fax ?? null,
    addressCapitol: currentTerm.address ?? currentTerm.office ?? null,
    addressDistrict: null,
    contactFormUrl: currentTerm.contact_form ?? null,
    website: currentTerm.url ?? null,
    twitterHandle: raw.social?.twitter ?? null,
    facebookId: raw.social?.facebook ?? null,
    youtubeId: raw.social?.youtube ?? null,
  };
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    committer: {
      date: string;
    };
  };
}

export async function checkGitHubCommitSha(): Promise<string | null> {
  const url =
    "https://api.github.com/repos/unitedstates/congress-legislators/commits?path=legislators-current.yaml&per_page=1";

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "democracy-direct-data-refresh",
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    console.warn(`Failed to check GitHub commits: ${response.statusText}`);
    return null;
  }

  const commits = (await response.json()) as GitHubCommit[];
  if (commits.length === 0) {
    return null;
  }

  return commits[0].sha;
}

export async function fetchLegislatorsYaml(): Promise<string> {
  const url =
    "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch legislators: ${response.statusText}`);
  }
  return response.text();
}

export async function fetchSocialMediaYaml(): Promise<string> {
  const url =
    "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-social-media.yaml";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch social media: ${response.statusText}`);
  }
  return response.text();
}

interface SocialMediaEntry {
  id: {
    bioguide: string;
  };
  social?: {
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
}

export function mergeSocialMedia(
  legislators: RawLegislator[],
  socialYaml: string
): RawLegislator[] {
  const socialData = YAML.parse(socialYaml) as SocialMediaEntry[];
  const socialMap = new Map<string, SocialMediaEntry["social"]>();

  for (const entry of socialData) {
    if (entry.social) {
      socialMap.set(entry.id.bioguide, entry.social);
    }
  }

  return legislators.map((leg) => ({
    ...leg,
    social: socialMap.get(leg.id.bioguide) ?? leg.social,
  }));
}

const BATCH_SIZE = 50;
const GITHUB_LEGISLATORS_URL =
  "https://github.com/unitedstates/congress-legislators/blob/main/legislators-current.yaml";

export async function importLegislators(force: boolean = false): Promise<ImportResult> {
  const startTime = Date.now();
  const { createDb } = await import("@/db/client");
  const { legislators, dataSourceMeta } = await import("@/db/schema");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const db = createDb(databaseUrl);

  console.log("Checking GitHub for changes...");
  const currentCommitSha = await checkGitHubCommitSha();

  if (!force) {
    if (!currentCommitSha) {
      console.warn(
        "Warning: Unable to retrieve latest GitHub commit SHA; skipping change detection and proceeding with full import."
      );
    } else {
      const [existingMeta] = await db
        .select()
        .from(dataSourceMeta)
        .where(eq(dataSourceMeta.id, "legislators"));

      if (existingMeta?.lastModified === currentCommitSha) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
        console.log(`No changes detected (SHA: ${currentCommitSha.substring(0, 7)})`);
        return {
          source: "github",
          changed: false,
          recordsProcessed: 0,
          recordsUpserted: 0,
          duration,
          commitSha: currentCommitSha,
        };
      }
    }
  }

  console.log("Fetching legislators from GitHub...");
  const [legislatorsYaml, socialYaml] = await Promise.all([
    fetchLegislatorsYaml(),
    fetchSocialMediaYaml(),
  ]);

  console.log("Parsing YAML data...");
  let rawLegislators = parseLegislatorYaml(legislatorsYaml);
  rawLegislators = mergeSocialMedia(rawLegislators, socialYaml);

  console.log(`Found ${rawLegislators.length} legislators`);

  const transformed = rawLegislators.map(transformLegislator);

  console.log(`Upserting legislators in batches of ${BATCH_SIZE}...`);
  let upserted = 0;

  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE);

    await db
      .insert(legislators)
      .values(
        batch.map((leg) => ({
          bioguideId: leg.bioguideId,
          firstName: leg.firstName,
          lastName: leg.lastName,
          fullName: leg.fullName,
          party: leg.party,
          state: leg.state,
          district: leg.district,
          chamber: leg.chamber,
          title: leg.title,
          termStart: leg.termStart,
          termEnd: leg.termEnd,
          phoneCapitol: leg.phoneCapitol,
          phoneDistrict: leg.phoneDistrict,
          fax: leg.fax,
          addressCapitol: leg.addressCapitol,
          addressDistrict: leg.addressDistrict,
          contactFormUrl: leg.contactFormUrl,
          website: leg.website,
          twitterHandle: leg.twitterHandle,
          facebookId: leg.facebookId,
          youtubeId: leg.youtubeId,
        }))
      )
      .onConflictDoUpdate({
        target: legislators.bioguideId,
        set: {
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          fullName: sql`excluded.full_name`,
          party: sql`excluded.party`,
          state: sql`excluded.state`,
          district: sql`excluded.district`,
          chamber: sql`excluded.chamber`,
          title: sql`excluded.title`,
          termStart: sql`excluded.term_start`,
          termEnd: sql`excluded.term_end`,
          phoneCapitol: sql`excluded.phone_capitol`,
          phoneDistrict: sql`excluded.phone_district`,
          fax: sql`excluded.fax`,
          addressCapitol: sql`excluded.address_capitol`,
          addressDistrict: sql`excluded.address_district`,
          contactFormUrl: sql`excluded.contact_form_url`,
          website: sql`excluded.website`,
          twitterHandle: sql`excluded.twitter_handle`,
          facebookId: sql`excluded.facebook_id`,
          youtubeId: sql`excluded.youtube_id`,
        },
      });

    upserted += batch.length;
    console.log(`Upserted ${upserted} / ${transformed.length} legislators...`);
  }

  const [existingMeta] = await db
    .select()
    .from(dataSourceMeta)
    .where(eq(dataSourceMeta.id, "legislators"));

  const sourceChanged = currentCommitSha && existingMeta?.lastModified !== currentCommitSha;

  await db
    .insert(dataSourceMeta)
    .values({
      id: "legislators",
      sourceUrl: GITHUB_LEGISLATORS_URL,
      lastModified: currentCommitSha,
      lastChecked: new Date(),
      lastChanged: sourceChanged ? new Date() : (existingMeta?.lastChanged ?? new Date()),
      recordCount: upserted,
    })
    .onConflictDoUpdate({
      target: dataSourceMeta.id,
      set: {
        lastModified: currentCommitSha,
        lastChecked: new Date(),
        ...(sourceChanged ? { lastChanged: new Date() } : {}),
        recordCount: upserted,
      },
    });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
  console.log(`Import complete: ${upserted} legislators upserted`);

  return {
    source: "github",
    changed: true,
    recordsProcessed: rawLegislators.length,
    recordsUpserted: upserted,
    duration,
    commitSha: currentCommitSha,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes("--force");
  if (force) {
    console.log("Force mode: bypassing change detection");
  }

  importLegislators(force)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Import failed:", error);
      process.exit(1);
    });
}
