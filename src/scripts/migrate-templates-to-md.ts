import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { templates } from "@/db/schema";
import { plainTextToMarkdown } from "@/lib/markdown";
import { eq } from "drizzle-orm";

async function migrateTemplates() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("Fetching all templates...");

  const allTemplates = await db
    .select({
      id: templates.id,
      title: templates.title,
      body: templates.body,
    })
    .from(templates);

  console.log(`Found ${allTemplates.length} templates to check`);

  let convertedCount = 0;
  let skippedCount = 0;

  for (const template of allTemplates) {
    const originalBody = template.body;
    const convertedBody = plainTextToMarkdown(originalBody);

    if (originalBody === convertedBody) {
      skippedCount++;
      continue;
    }

    console.log(`Converting: "${template.title}" (${template.id})`);
    console.log(`  Before: ${originalBody.substring(0, 50)}...`);
    console.log(`  After:  ${convertedBody.substring(0, 50)}...`);

    await db.update(templates).set({ body: convertedBody }).where(eq(templates.id, template.id));

    convertedCount++;
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Converted: ${convertedCount}`);
  console.log(`Skipped (no changes needed): ${skippedCount}`);
  console.log(`Total: ${allTemplates.length}`);
}

migrateTemplates().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
