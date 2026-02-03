import { describe, it, expect } from "vitest";
import { makeModerationDecision, DEFAULT_THRESHOLDS, type ModerationThresholds } from "./decision";
import type { ModerationResult, ModerationCategory } from "./openai";

function createModerationResult(
  flagged: boolean,
  scores: Partial<ModerationCategory>
): ModerationResult {
  const defaultScores: ModerationCategory = {
    harassment: 0,
    "harassment/threatening": 0,
    hate: 0,
    "hate/threatening": 0,
    "self-harm": 0,
    "self-harm/intent": 0,
    "self-harm/instructions": 0,
    sexual: 0,
    "sexual/minors": 0,
    violence: 0,
    "violence/graphic": 0,
  };

  return {
    flagged,
    categories: {},
    categoryScores: { ...defaultScores, ...scores },
  };
}

describe("Moderation Decision Logic", () => {
  describe("makeModerationDecision", () => {
    it("sends flagged content to review", () => {
      const result = createModerationResult(true, { harassment: 0.9 });
      const decision = makeModerationDecision(result);

      expect(decision.decision).toBe("review");
      expect(decision.flagged).toBe(true);
    });

    it("sends content above rejection threshold to review", () => {
      const result = createModerationResult(false, { hate: 0.85 });
      const decision = makeModerationDecision(result);

      expect(decision.decision).toBe("review");
      expect(decision.highestCategory).toBe("hate");
      expect(decision.highestScore).toBe(0.85);
    });

    it("sends borderline content to review", () => {
      const result = createModerationResult(false, { violence: 0.5 });
      const decision = makeModerationDecision(result);

      expect(decision.decision).toBe("review");
      expect(decision.reason).toContain("requires review");
    });

    it("auto-approves very low risk content", () => {
      const result = createModerationResult(false, { harassment: 0.05 });
      const decision = makeModerationDecision(result);

      expect(decision.decision).toBe("approve");
      expect(decision.reason).toContain("Auto-approved");
    });

    it("auto-approves trusted user content below review threshold", () => {
      const result = createModerationResult(false, { harassment: 0.2 });
      const decision = makeModerationDecision(result, DEFAULT_THRESHOLDS, 1);

      expect(decision.decision).toBe("approve");
      expect(decision.reason).toContain("trusted user");
    });

    it("sends new user content to review even with moderate scores", () => {
      const result = createModerationResult(false, { harassment: 0.15 });
      const decision = makeModerationDecision(result, DEFAULT_THRESHOLDS, 0);

      expect(decision.decision).toBe("review");
      expect(decision.reason).toContain("New user");
    });

    it("respects custom thresholds", () => {
      const customThresholds: ModerationThresholds = {
        rejectThreshold: 0.5,
        reviewThreshold: 0.1,
      };

      const result = createModerationResult(false, { hate: 0.55 });
      const decision = makeModerationDecision(result, customThresholds);

      expect(decision.decision).toBe("review");
    });

    it("returns correct highest category", () => {
      const result = createModerationResult(false, {
        harassment: 0.1,
        hate: 0.3,
        violence: 0.5,
      });
      const decision = makeModerationDecision(result);

      expect(decision.highestCategory).toBe("violence");
      expect(decision.highestScore).toBe(0.5);
    });

    it("handles clean content with all zero scores", () => {
      const result = createModerationResult(false, {});
      const decision = makeModerationDecision(result, DEFAULT_THRESHOLDS, 1);

      expect(decision.decision).toBe("approve");
    });

    it("rejects content from banned users regardless of score", () => {
      const result = createModerationResult(false, { harassment: 0.01 });
      const decision = makeModerationDecision(result, DEFAULT_THRESHOLDS, -1);

      expect(decision.decision).toBe("reject");
      expect(decision.reason).toBe("User is banned");
    });
  });
});
