import "dotenv/config";
import { createHash } from "crypto";
import { createDb } from "@/db/client";
import { templates, issueTags, templateIssueTags } from "@/db/schema";
import { generateSlug } from "@/lib/template-validation";
import { eq, inArray, sql } from "drizzle-orm";

export interface SeedTemplate {
  title: string;
  description: string;
  body: string;
  issueTags: string[];
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    title: "Request for Healthcare Policy Update",
    description:
      "Ask your representative to support affordable healthcare, protect pre-existing condition coverage, and lower prescription drug costs.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

As your constituent in {{STATE}}, I am writing to share my concerns about healthcare access in our community.

Many families in our area struggle to afford quality healthcare coverage. Rising premiums, high deductibles, and the cost of prescription medications create real hardships for working people.

I urge you to support policies that expand access to affordable healthcare, protect coverage for pre-existing conditions, and address the rising cost of prescription drugs.

I would appreciate hearing your position on these issues and what steps you are taking to address healthcare affordability for your constituents.

Thank you for your service and for considering my views.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["healthcare"],
  },
  {
    title: "Support Public Education Funding",
    description:
      "Urge increased funding for public schools, smaller class sizes, and fair teacher pay in your community.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing as a concerned constituent regarding the state of public education in {{STATE}}.

Our public schools are the foundation of our communities. Teachers are working hard with limited resources, class sizes are growing, and many schools lack the funding needed for basic supplies, let alone modern technology and facilities.

I respectfully ask that you prioritize funding for public education. Our children's future depends on the investments we make today in their schools.

Please support legislation that increases education funding, supports teachers, and ensures every child has access to a quality education regardless of their zip code.

I look forward to your response on this important issue.

Respectfully,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["education"],
  },
  {
    title: "Address Climate Change and Environmental Protection",
    description:
      "Call for action on climate change, clean energy investment, and protection of air and water quality.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing to express my concern about climate change and environmental protection.

The effects of climate change are already impacting communities across {{STATE}}, from extreme weather events to air and water quality issues. These are not distant threats but present realities affecting our health, economy, and way of life.

I urge you to support common-sense environmental policies that protect our air and water, invest in clean energy, and create jobs in sustainable industries.

We owe it to future generations to act responsibly now. I hope you will make environmental protection a priority in your work.

Thank you for considering my views.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["climate", "environment"],
  },
  {
    title: "Address Housing Affordability Crisis",
    description:
      "Request policies to increase affordable housing, protect renters, and help first-time homebuyers.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing about the housing affordability crisis affecting families in {{STATE}}.

The cost of housing, whether renting or buying, has outpaced wage growth for years. Many hardworking families spend more than half their income on housing, leaving little for other necessities. Young people cannot afford to stay in the communities where they grew up.

I ask you to support policies that increase the supply of affordable housing, protect tenants from unfair practices, and help first-time homebuyers achieve the dream of homeownership.

Housing stability is fundamental to strong communities. Please make this issue a priority.

Thank you for your attention to this matter.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["housing"],
  },
  {
    title: "Protect Civil Rights and Equal Treatment",
    description:
      "Ask your representative to strengthen civil rights protections and ensure equal treatment under law.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing to urge you to protect and strengthen civil rights for all Americans.

The promise of equal treatment under the law is foundational to our democracy. Every person deserves to be treated with dignity and to have their rights protected, regardless of their race, religion, gender, disability status, or background.

Please support legislation that strengthens civil rights protections, ensures equal access to opportunities, and holds accountable those who violate the rights of others.

I believe these values unite us as Americans. I hope you will champion them in your work.

Thank you for your service.

Respectfully,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["civil-rights"],
  },
  {
    title: "Improve Local Infrastructure",
    description:
      "Support for road, bridge, and water system improvements that create jobs and improve safety.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing about the need for infrastructure investment in our community.

Our roads, bridges, water systems, and public facilities are aging and in need of repair and modernization. Potholes, traffic congestion, and outdated utilities affect our daily lives and our local economy.

I urge you to support infrastructure funding that addresses these needs in {{STATE}}. Investments in infrastructure create good jobs, improve safety, and lay the foundation for economic growth.

Please prioritize bringing infrastructure dollars back to our community.

Thank you for your consideration.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["infrastructure"],
  },
  {
    title: "Increase Government Transparency",
    description:
      "Call for open government, stronger ethics rules, and public access to legislative information.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing to ask for your commitment to government transparency and accountability.

Citizens deserve to know how their government operates and how their tax dollars are spent. Open government builds trust and allows voters to make informed decisions.

I urge you to support measures that increase transparency in government operations, strengthen ethics rules, protect whistleblowers, and ensure public access to information about legislative activities and spending.

Democracy works best when government works in the open. Please be a champion for transparency.

Thank you for your service to our community.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["transparency", "government"],
  },
  {
    title: "Support Our Veterans",
    description:
      "Urge full funding for VA healthcare, veteran employment programs, and mental health services.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing to ask for your continued support of our veterans.

The men and women who served our country deserve our full support when they return home. Too many veterans struggle with accessing healthcare, finding employment, securing housing, or getting the benefits they earned.

Please support funding for the VA, programs that help veterans transition to civilian life, mental health services for those dealing with the invisible wounds of war, and efforts to end veteran homelessness.

We must keep our promises to those who kept us safe.

Thank you for your attention to this important issue.

Respectfully,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["veterans"],
  },
  {
    title: "Reform Immigration System",
    description:
      "Ask for bipartisan work on border security, legal pathways, and a fair immigration process.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing regarding the need for comprehensive immigration reform.

Our immigration system is widely acknowledged to be broken. Families are separated, employers cannot find workers, and the path to legal status is unclear and takes years or decades.

I urge you to work across the aisle to fix our immigration system. We need solutions that secure our borders, provide a fair process for those seeking to come here legally, address the status of those already here, and reflect our values as a nation of immigrants.

This issue requires leadership and compromise. I hope you will be part of the solution.

Thank you for considering my views.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["immigration"],
  },
  {
    title: "Support Small Businesses and Local Economy",
    description:
      "Request support for small business loans, tax relief, and fair competition policies.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing about the importance of supporting small businesses in {{STATE}}.

Small businesses are the backbone of our local economy. They create jobs, serve our communities, and keep dollars circulating locally. Yet they often face challenges that large corporations do not, from accessing capital to navigating regulations.

Please support policies that help small businesses thrive, including access to affordable loans, tax relief, reduced regulatory burden, and fair competition with large corporations.

Strong small businesses mean strong communities.

Thank you for your consideration.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["economy", "small-business"],
  },
  {
    title: "Protect Social Security and Medicare",
    description:
      "Oppose benefit cuts and ask your representative to strengthen these programs for future generations.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing to urge you to protect Social Security and Medicare.

These programs provide essential security for seniors, people with disabilities, and families who have lost a wage earner. Americans have paid into these programs throughout their working lives and count on them being there when needed.

Please oppose any efforts to cut benefits, privatize these programs, or raise the eligibility age. Instead, work to strengthen them for current and future generations.

These are promises made to the American people. Please keep them.

Thank you for your service.

Respectfully,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["social-security", "medicare", "seniors"],
  },
  {
    title: "Address Gun Violence Prevention",
    description:
      "Support common-sense measures to reduce gun violence while respecting Second Amendment rights.",
    body: `Dear {{REP_TITLE}} {{REP_LAST}},

I am writing to express my concern about gun violence in our communities.

Too many families have been affected by gun violence, whether through mass shootings, domestic violence, accidents, or everyday crime. This is a public health crisis that demands attention.

I urge you to support common-sense measures that can reduce gun violence while respecting the rights of law-abiding gun owners. This includes strengthening background checks, supporting violence intervention programs, and funding research into gun violence prevention.

We can protect both lives and rights. Please work toward solutions.

Thank you for considering my views.

Sincerely,
{{USER_NAME}}
{{USER_CITY}}, {{STATE}}`,
    issueTags: ["gun-violence", "public-safety"],
  },
];

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function seedTemplates(): Promise<{
  total: number;
  upserted: number;
}> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const db = createDb(databaseUrl);

  console.log(`Seeding ${SEED_TEMPLATES.length} templates...`);

  let upserted = 0;

  for (const tpl of SEED_TEMPLATES) {
    const contentHash = hashContent(tpl.title + tpl.body);
    const slug = generateSlug(tpl.title);

    const [insertedTemplate] = await db
      .insert(templates)
      .values({
        slug,
        title: tpl.title,
        description: tpl.description,
        body: tpl.body,
        issueTags: tpl.issueTags,
        contentHash,
        isPublic: true,
        moderationStatus: "approved",
        userId: null,
      })
      .onConflictDoUpdate({
        target: templates.contentHash,
        set: {
          title: tpl.title,
          description: tpl.description,
          body: tpl.body,
          issueTags: tpl.issueTags,
          updatedAt: new Date(),
        },
      })
      .returning({ id: templates.id });

    if (tpl.issueTags.length > 0) {
      const lowerTags = tpl.issueTags.map((t) => t.toLowerCase());
      const matchingTags = await db
        .select({ id: issueTags.id })
        .from(issueTags)
        .where(inArray(sql`LOWER(${issueTags.name})`, lowerTags));

      if (matchingTags.length > 0) {
        await db
          .delete(templateIssueTags)
          .where(eq(templateIssueTags.templateId, insertedTemplate.id));
        await db.insert(templateIssueTags).values(
          matchingTags.map((tag) => ({
            templateId: insertedTemplate.id,
            issueTagId: tag.id,
          }))
        );
      }
    }

    upserted++;
    console.log(`  ✓ ${tpl.title}`);
  }

  console.log(`Seed complete: ${upserted} templates upserted`);

  return { total: SEED_TEMPLATES.length, upserted };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then((result) => {
      console.log(`Seed successful: ${result.upserted} of ${result.total} templates`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
