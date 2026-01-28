import { moderateContent } from "./openai";
import { makeModerationDecision, scoresToRecord, type DecisionResult } from "./decision";

export interface ModerationOutcome {
  status: "approved" | "pending" | "rejected";
  scores: Record<string, number> | null;
  decision: DecisionResult | null;
}

const DECISION_TO_STATUS: Record<string, "approved" | "pending" | "rejected"> = {
  approve: "approved",
  review: "pending",
  reject: "rejected",
};

export async function moderateTemplate(
  content: string,
  apiKey: string | undefined,
  userTrustLevel: number
): Promise<ModerationOutcome> {
  if (!apiKey) {
    return {
      status: "pending",
      scores: null,
      decision: null,
    };
  }

  try {
    const result = await moderateContent(content, apiKey);
    const decision = makeModerationDecision(result, undefined, userTrustLevel);

    return {
      status: DECISION_TO_STATUS[decision.decision],
      scores: scoresToRecord(result.categoryScores),
      decision,
    };
  } catch (error) {
    console.error("Moderation API error:", error);
    return {
      status: "pending",
      scores: null,
      decision: null,
    };
  }
}
