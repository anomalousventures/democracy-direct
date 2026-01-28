import type { ModerationResult, ModerationCategory } from "./openai";
import { getHighestCategoryScore } from "./openai";

export type ModerationDecision = "approve" | "reject" | "review";

export interface ModerationThresholds {
  rejectThreshold: number;
  reviewThreshold: number;
}

export const DEFAULT_THRESHOLDS: ModerationThresholds = {
  rejectThreshold: 0.8,
  reviewThreshold: 0.3,
};

export interface DecisionResult {
  decision: ModerationDecision;
  reason: string;
  highestCategory: string;
  highestScore: number;
  flagged: boolean;
}

export function makeModerationDecision(
  result: ModerationResult,
  thresholds: ModerationThresholds = DEFAULT_THRESHOLDS,
  userTrustLevel: number = 0
): DecisionResult {
  const { category, score } = getHighestCategoryScore(result.categoryScores);

  if (result.flagged || score >= thresholds.rejectThreshold) {
    return {
      decision: "reject",
      reason: `Content flagged for ${category} (score: ${score.toFixed(3)})`,
      highestCategory: category,
      highestScore: score,
      flagged: result.flagged,
    };
  }

  if (score >= thresholds.reviewThreshold) {
    return {
      decision: "review",
      reason: `Content requires review for ${category} (score: ${score.toFixed(3)})`,
      highestCategory: category,
      highestScore: score,
      flagged: result.flagged,
    };
  }

  if (userTrustLevel >= 1 && score < thresholds.reviewThreshold) {
    return {
      decision: "approve",
      reason: `Auto-approved: trusted user (trust level ${userTrustLevel}) with clean content`,
      highestCategory: category,
      highestScore: score,
      flagged: false,
    };
  }

  if (score < 0.1) {
    return {
      decision: "approve",
      reason: `Auto-approved: very low risk content (highest score: ${score.toFixed(3)})`,
      highestCategory: category,
      highestScore: score,
      flagged: false,
    };
  }

  return {
    decision: "review",
    reason: `New user content requires review (score: ${score.toFixed(3)})`,
    highestCategory: category,
    highestScore: score,
    flagged: false,
  };
}

export function scoresToRecord(scores: ModerationCategory): Record<string, number> {
  return scores as unknown as Record<string, number>;
}
