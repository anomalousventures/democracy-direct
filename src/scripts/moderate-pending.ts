import "dotenv/config";
import { createDb } from "@/db/client";
import { templates } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { moderateContent } from "@/lib/moderation/openai";
import { makeModerationDecision, scoresToRecord } from "@/lib/moderation/decision";

const DECISION_TO_STATUS = {
  approve: "approved",
  review: "pending",
  reject: "rejected",
} as const;

export interface ModeratePendingResult {
  total: number;
  processed: number;
  errors: number;
  needsReview: number;
}

export async function sendDiscordNotification(
  webhookUrl: string,
  result: ModeratePendingResult
): Promise<void> {
  const messages: string[] = [];

  if (result.needsReview > 0) {
    messages.push(`📋 **${result.needsReview}** template(s) need admin review`);
  }

  if (result.errors > 0) {
    messages.push(`⚠️ **${result.errors}** moderation API error(s) occurred`);
  }

  if (messages.length === 0) {
    return;
  }

  const content = [
    "**Moderation Script Report**",
    ...messages,
    `\nProcessed ${result.processed}/${result.total} templates`,
  ].join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
  }
}

export async function processPendingModeration(
  databaseUrl?: string,
  openaiApiKey?: string,
  options: { limit?: number; delayMs?: number; discordWebhookUrl?: string } = {}
): Promise<ModeratePendingResult> {
  const dbUrl = databaseUrl ?? process.env.DATABASE_URL;
  const apiKey = openaiApiKey ?? process.env.OPENAI_API_KEY;

  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const { limit = 50, delayMs = 200, discordWebhookUrl } = options;

  const db = createDb(dbUrl);

  const pending = await db
    .select({
      id: templates.id,
      title: templates.title,
      body: templates.body,
    })
    .from(templates)
    .where(and(eq(templates.moderationStatus, "pending"), isNull(templates.moderationScores)))
    .limit(limit);

  console.log(`Found ${pending.length} templates without moderation scores`);

  let processed = 0;
  let errors = 0;
  let needsReview = 0;

  for (let i = 0; i < pending.length; i++) {
    const template = pending[i];
    try {
      const content = `${template.title}\n\n${template.body}`;
      const result = await moderateContent(content, apiKey);
      const decision = makeModerationDecision(result, undefined, 0);

      await db
        .update(templates)
        .set({
          moderationScores: scoresToRecord(result.categoryScores),
          moderationStatus: DECISION_TO_STATUS[decision.decision],
          updatedAt: new Date(),
        })
        .where(eq(templates.id, template.id));

      console.log(`  ${template.id}: ${decision.decision}`);
      processed++;

      if (decision.decision === "review") {
        needsReview++;
      }

      if (delayMs > 0 && i < pending.length - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } catch (error) {
      console.error(`  ${template.id}: ERROR -`, error);
      errors++;
    }
  }

  const result = { total: pending.length, processed, errors, needsReview };

  const webhookUrl = discordWebhookUrl ?? process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl && (needsReview > 0 || errors > 0)) {
    try {
      await sendDiscordNotification(webhookUrl, result);
      console.log("Discord notification sent");
    } catch (error) {
      console.error("Failed to send Discord notification:", error);
    }
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processPendingModeration()
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Moderation failed:", error);
      process.exit(1);
    });
}
