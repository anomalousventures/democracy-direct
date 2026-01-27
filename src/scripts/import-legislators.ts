import YAML from "yaml";

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

export function parseLegislatorYaml(yamlContent: string): RawLegislator[] {
  return YAML.parse(yamlContent) as RawLegislator[];
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

export async function importLegislators(): Promise<{
  total: number;
  inserted: number;
  updated: number;
}> {
  const { neon } = await import("@neondatabase/serverless");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(databaseUrl);

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

  console.log("Upserting legislators to database...");
  let inserted = 0;
  let updated = 0;

  for (const leg of transformed) {
    const result = await sql`
      INSERT INTO legislators (
        bioguide_id, first_name, last_name, full_name, party, state, district,
        chamber, title, term_start, term_end, phone_capitol, phone_district,
        fax, address_capitol, address_district, contact_form_url, website,
        twitter_handle, facebook_id, youtube_id
      ) VALUES (
        ${leg.bioguideId}, ${leg.firstName}, ${leg.lastName}, ${leg.fullName},
        ${leg.party}, ${leg.state}, ${leg.district}, ${leg.chamber}, ${leg.title},
        ${leg.termStart}, ${leg.termEnd}, ${leg.phoneCapitol}, ${leg.phoneDistrict},
        ${leg.fax}, ${leg.addressCapitol}, ${leg.addressDistrict},
        ${leg.contactFormUrl}, ${leg.website}, ${leg.twitterHandle},
        ${leg.facebookId}, ${leg.youtubeId}
      )
      ON CONFLICT (bioguide_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        party = EXCLUDED.party,
        state = EXCLUDED.state,
        district = EXCLUDED.district,
        chamber = EXCLUDED.chamber,
        title = EXCLUDED.title,
        term_start = EXCLUDED.term_start,
        term_end = EXCLUDED.term_end,
        phone_capitol = EXCLUDED.phone_capitol,
        phone_district = EXCLUDED.phone_district,
        fax = EXCLUDED.fax,
        address_capitol = EXCLUDED.address_capitol,
        address_district = EXCLUDED.address_district,
        contact_form_url = EXCLUDED.contact_form_url,
        website = EXCLUDED.website,
        twitter_handle = EXCLUDED.twitter_handle,
        facebook_id = EXCLUDED.facebook_id,
        youtube_id = EXCLUDED.youtube_id
      RETURNING (xmax = 0) AS inserted
    `;

    if (result[0]?.inserted) {
      inserted++;
    } else {
      updated++;
    }
  }

  console.log(`Import complete: ${inserted} inserted, ${updated} updated`);

  return { total: transformed.length, inserted, updated };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  importLegislators()
    .then((result) => {
      console.log("Import successful:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Import failed:", error);
      process.exit(1);
    });
}
