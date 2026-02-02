import { describe, it, expect } from "vitest";
import {
  calculateTrustLevel,
  getTrustLevelLabel,
  canCreateTemplates,
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

  describe("hasMinTrustLevel", () => {
    it.each([
      { user: null, minLevel: TRUST_LEVELS.NEW_USER, expected: false, desc: "null user" },
      { user: undefined, minLevel: TRUST_LEVELS.NEW_USER, expected: false, desc: "undefined user" },
      {
        user: { trustLevel: TRUST_LEVELS.TRUSTED },
        minLevel: TRUST_LEVELS.TRUSTED,
        expected: true,
        desc: "user meets minimum",
      },
      {
        user: { trustLevel: TRUST_LEVELS.ADMIN },
        minLevel: TRUST_LEVELS.TRUSTED,
        expected: true,
        desc: "user exceeds minimum",
      },
      {
        user: { trustLevel: TRUST_LEVELS.NEW_USER },
        minLevel: TRUST_LEVELS.TRUSTED,
        expected: false,
        desc: "user below minimum",
      },
    ])("returns $expected for $desc", ({ user, minLevel, expected }) => {
      expect(hasMinTrustLevel(user, minLevel)).toBe(expected);
    });
  });

  describe("isTrusted", () => {
    it.each([
      { user: null, expected: false, desc: "null user" },
      { user: { trustLevel: TRUST_LEVELS.BANNED }, expected: false, desc: "banned user" },
      { user: { trustLevel: TRUST_LEVELS.NEW_USER }, expected: false, desc: "new user" },
      { user: { trustLevel: TRUST_LEVELS.TRUSTED }, expected: true, desc: "trusted user" },
      { user: { trustLevel: TRUST_LEVELS.ADMIN }, expected: true, desc: "admin" },
    ])("returns $expected for $desc", ({ user, expected }) => {
      expect(isTrusted(user)).toBe(expected);
    });
  });

  describe("isAdmin", () => {
    it.each([
      { user: null, expected: false, desc: "null user" },
      { user: { trustLevel: TRUST_LEVELS.BANNED }, expected: false, desc: "banned user" },
      { user: { trustLevel: TRUST_LEVELS.NEW_USER }, expected: false, desc: "new user" },
      { user: { trustLevel: TRUST_LEVELS.TRUSTED }, expected: false, desc: "trusted user" },
      { user: { trustLevel: TRUST_LEVELS.ADMIN }, expected: true, desc: "admin" },
    ])("returns $expected for $desc", ({ user, expected }) => {
      expect(isAdmin(user)).toBe(expected);
    });
  });

  describe("isBanned", () => {
    it.each([
      { user: null, expected: false, desc: "null user" },
      { user: { trustLevel: TRUST_LEVELS.BANNED }, expected: true, desc: "banned user" },
      { user: { trustLevel: TRUST_LEVELS.NEW_USER }, expected: false, desc: "new user" },
      { user: { trustLevel: TRUST_LEVELS.TRUSTED }, expected: false, desc: "trusted user" },
      { user: { trustLevel: TRUST_LEVELS.ADMIN }, expected: false, desc: "admin" },
    ])("returns $expected for $desc", ({ user, expected }) => {
      expect(isBanned(user)).toBe(expected);
    });
  });
});
