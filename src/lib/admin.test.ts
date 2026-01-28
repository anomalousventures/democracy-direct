import { describe, it, expect } from "vitest";
import { isAdmin, requireAdmin, ADMIN_TRUST_LEVEL } from "./admin";

describe("admin", () => {
  describe("isAdmin", () => {
    it("returns true for user with trust_level >= 2", () => {
      expect(isAdmin({ trustLevel: ADMIN_TRUST_LEVEL })).toBe(true);
      expect(isAdmin({ trustLevel: 3 })).toBe(true);
      expect(isAdmin({ trustLevel: 10 })).toBe(true);
    });

    it("returns false for user with trust_level < 2", () => {
      expect(isAdmin({ trustLevel: 1 })).toBe(false);
      expect(isAdmin({ trustLevel: 0 })).toBe(false);
      expect(isAdmin({ trustLevel: -1 })).toBe(false);
    });

    it("returns false for null user", () => {
      expect(isAdmin(null)).toBe(false);
    });

    it("returns false for undefined user", () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe("requireAdmin", () => {
    it("returns 401 for unauthenticated user", () => {
      const response = requireAdmin(null);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(401);
    });

    it("returns 403 for non-admin user", () => {
      const response = requireAdmin({ id: "user-1", trustLevel: 1 });
      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
    });

    it("returns null for admin user", () => {
      const response = requireAdmin({ id: "admin-1", trustLevel: ADMIN_TRUST_LEVEL });
      expect(response).toBeNull();
    });
  });
});
