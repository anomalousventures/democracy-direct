import { moderateContent } from "./openai";
import { makeModerationDecision, scoresToRecord, type DecisionResult } from "./decision";
import type { Logger } from "@/lib/logger";

export interface ModerationOutcome {
  status: "approved" | "pending" | "rejected";
  scores: Record<string, number> | null;
  decision: DecisionResult | null;
}

export interface ModerationContext {
  templateId?: string;
  slug?: string;
}

const DECISION_TO_STATUS: Record<string, "approved" | "pending" | "rejected"> = {
  approve: "approved",
  review: "pending",
  reject: "rejected",
};

export async function moderateTemplate(
  content: string,
  apiKey: string | undefined,
  userTrustLevel: number,
  logger?: Logger,
  context?: ModerationContext
): Promise<ModerationOutcome> {
  if (!apiKey) {
    logger?.warn("moderation_skipped", { reason: "no_api_key", ...context });
    return {
      status: "pending",
      scores: null,
      decision: null,
    };
  }

  try {
    const result = await moderateContent(content, apiKey);
    const decision = makeModerationDecision(result, undefined, userTrustLevel);

    logger?.info("moderation_complete", {
      ...context,
      status: DECISION_TO_STATUS[decision.decision],
      flagged: result.flagged,
      highestCategory: decision.highestCategory,
      highestScore: decision.highestScore,
      decision: decision.decision,
    });

    return {
      status: DECISION_TO_STATUS[decision.decision],
      scores: scoresToRecord(result.categoryScores),
      decision,
    };
  } catch (error) {
    logger?.error("moderation_failed", {
      ...context,
      error: error instanceof Error ? error.message : "Unknown error",
      service: "openai",
    });
    return {
      status: "pending",
      scores: null,
      decision: null,
    };
  }
}
