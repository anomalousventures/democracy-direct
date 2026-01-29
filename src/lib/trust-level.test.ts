import { describe, it, expect } from "vitest";
import {
  calculateTrustLevel,
  shouldAutoApprove,
  getTrustLevelLabel,
  canCreateTemplates,
  canBypassModeration,
  hasMinTrustLevel,
  isTrusted,
  isAdmin,
  isBanned,
  TRUST_LEVELS,
  APPROVED_TEMPLATES_FOR_TRUST,
} from "./trust-level";

describe("Trust Level System", () => {
  describe("calculateTrustLevel", () => {
    it("returns NEW_USER for new user with no approved templates", () => {
      const result = calculateTrustLevel(0, 0);
      expect(result).toBe(TRUST_LEVELS.NEW_USER);
    });

    it("returns TRUSTED after enough approved templates", () => {
      const result = calculateTrustLevel(0, APPROVED_TEMPLATES_FOR_TRUST);
      expect(result).toBe(TRUST_LEVELS.TRUSTED);
    });

    it("returns ADMIN for admin users", () => {
      const result = calculateTrustLevel(0, 0, true);
      expect(result).toBe(TRUST_LEVELS.ADMIN);
    });

    it("keeps BANNED status regardless of approved templates", () => {
      const result = calculateTrustLevel(TRUST_LEVELS.BANNED, 10);
      expect(result).toBe(TRUST_LEVELS.BANNED);
    });

    it("does not downgrade trust level", () => {
      const result = calculateTrustLevel(TRUST_LEVELS.TRUSTED, 0);
      expect(result).toBe(TRUST_LEVELS.TRUSTED);
    });
  });

  describe("shouldAutoApprove", () => {
    it("auto-approves admin content regardless of score", () => {
      expect(shouldAutoApprove(TRUST_LEVELS.ADMIN, 0.9)).toBe(true);
    });

    it("auto-approves trusted user with low score", () => {
      expect(shouldAutoApprove(TRUST_LEVELS.TRUSTED, 0.2)).toBe(true);
    });

    it("does not auto-approve trusted user with moderate score", () => {
      expect(shouldAutoApprove(TRUST_LEVELS.TRUSTED, 0.5)).toBe(false);
    });

    it("auto-approves new user with very low score", () => {
      expect(shouldAutoApprove(TRUST_LEVELS.NEW_USER, 0.05)).toBe(true);
    });

    it("does not auto-approve new user with low-moderate score", () => {
      expect(shouldAutoApprove(TRUST_LEVELS.NEW_USER, 0.15)).toBe(false);
    });

    it("does not auto-approve banned users", () => {
      expect(shouldAutoApprove(TRUST_LEVELS.BANNED, 0.0)).toBe(false);
    });
  });

  describe("getTrustLevelLabel", () => {
    it("returns correct labels", () => {
      expect(getTrustLevelLabel(TRUST_LEVELS.BANNED)).toBe("Banned");
      expect(getTrustLevelLabel(TRUST_LEVELS.NEW_USER)).toBe("New User");
      expect(getTrustLevelLabel(TRUST_LEVELS.TRUSTED)).toBe("Trusted");
      expect(getTrustLevelLabel(TRUST_LEVELS.ADMIN)).toBe("Admin");
    });

    it("returns Unknown for invalid trust level", () => {
      expect(getTrustLevelLabel(99)).toBe("Unknown");
    });
  });

  describe("canCreateTemplates", () => {
    it("allows new users to create templates", () => {
      expect(canCreateTemplates(TRUST_LEVELS.NEW_USER)).toBe(true);
    });

    it("allows trusted users to create templates", () => {
      expect(canCreateTemplates(TRUST_LEVELS.TRUSTED)).toBe(true);
    });

    it("allows admins to create templates", () => {
      expect(canCreateTemplates(TRUST_LEVELS.ADMIN)).toBe(true);
    });

    it("does not allow banned users to create templates", () => {
      expect(canCreateTemplates(TRUST_LEVELS.BANNED)).toBe(false);
    });
  });

  describe("canBypassModeration", () => {
    it("only admins can bypass moderation", () => {
      expect(canBypassModeration(TRUST_LEVELS.ADMIN)).toBe(true);
      expect(canBypassModeration(TRUST_LEVELS.TRUSTED)).toBe(false);
      expect(canBypassModeration(TRUST_LEVELS.NEW_USER)).toBe(false);
      expect(canBypassModeration(TRUST_LEVELS.BANNED)).toBe(false);
    });
  });

  describe("hasMinTrustLevel", () => {
    it("returns false for null user", () => {
      expect(hasMinTrustLevel(null, TRUST_LEVELS.NEW_USER)).toBe(false);
    });

    it("returns false for undefined user", () => {
      expect(hasMinTrustLevel(undefined, TRUST_LEVELS.NEW_USER)).toBe(false);
    });

    it("returns true when user meets minimum level", () => {
      expect(hasMinTrustLevel({ trustLevel: TRUST_LEVELS.TRUSTED }, TRUST_LEVELS.TRUSTED)).toBe(
        true
      );
    });

    it("returns true when user exceeds minimum level", () => {
      expect(hasMinTrustLevel({ trustLevel: TRUST_LEVELS.ADMIN }, TRUST_LEVELS.TRUSTED)).toBe(true);
    });

    it("returns false when user is below minimum level", () => {
      expect(hasMinTrustLevel({ trustLevel: TRUST_LEVELS.NEW_USER }, TRUST_LEVELS.TRUSTED)).toBe(
        false
      );
    });
  });

  describe("isTrusted", () => {
    it("returns false for null user", () => {
      expect(isTrusted(null)).toBe(false);
    });

    it("returns false for new user", () => {
      expect(isTrusted({ trustLevel: TRUST_LEVELS.NEW_USER })).toBe(false);
    });

    it("returns true for trusted user", () => {
      expect(isTrusted({ trustLevel: TRUST_LEVELS.TRUSTED })).toBe(true);
    });

    it("returns true for admin", () => {
      expect(isTrusted({ trustLevel: TRUST_LEVELS.ADMIN })).toBe(true);
    });

    it("returns false for banned user", () => {
      expect(isTrusted({ trustLevel: TRUST_LEVELS.BANNED })).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("returns false for null user", () => {
      expect(isAdmin(null)).toBe(false);
    });

    it("returns false for trusted user", () => {
      expect(isAdmin({ trustLevel: TRUST_LEVELS.TRUSTED })).toBe(false);
    });

    it("returns true for admin", () => {
      expect(isAdmin({ trustLevel: TRUST_LEVELS.ADMIN })).toBe(true);
    });
  });

  describe("isBanned", () => {
    it("returns false for null user", () => {
      expect(isBanned(null)).toBe(false);
    });

    it("returns false for new user", () => {
      expect(isBanned({ trustLevel: TRUST_LEVELS.NEW_USER })).toBe(false);
    });

    it("returns true for banned user", () => {
      expect(isBanned({ trustLevel: TRUST_LEVELS.BANNED })).toBe(true);
    });
  });
});
