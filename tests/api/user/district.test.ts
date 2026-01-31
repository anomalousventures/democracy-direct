import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, DELETE } from "@/pages/api/user/district";

const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => ({
    update: mockUpdate,
  })),
}));

const mockLocals = {
  runtime: {
    env: {
      DATABASE_URL: "postgres://test",
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
  user: { id: "test-user-id", emailHash: "hash", trustLevel: 0 },
};

const mockLocalsNoUser = {
  runtime: {
    env: {
      DATABASE_URL: "postgres://test",
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
  user: null,
};

describe("User District API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  describe("POST /api/user/district", () => {
    it("requires authentication", async () => {
      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "CA", district: "12" }),
      });

      const response = await POST({
        locals: mockLocalsNoUser,
        request,
      } as never);

      expect(response.status).toBe(401);
    });

    it("saves valid state and district", async () => {
      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "CA", district: "12" }),
      });

      const response = await POST({
        locals: mockLocals,
        request,
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.savedState).toBe("CA");
      expect(data.savedDistrict).toBe("12");
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("uppercases state and district", async () => {
      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "ca", district: "al" }),
      });

      const response = await POST({
        locals: mockLocals,
        request,
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.savedState).toBe("CA");
      expect(data.savedDistrict).toBe("AL");
    });

    it("rejects invalid state", async () => {
      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "XX", district: "12" }),
      });

      const response = await POST({
        locals: mockLocals,
        request,
      } as never);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid state code");
    });

    it("rejects invalid district", async () => {
      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "CA", district: "abc" }),
      });

      const response = await POST({
        locals: mockLocals,
        request,
      } as never);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid district");
    });

    it("rejects missing fields", async () => {
      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "CA" }),
      });

      const response = await POST({
        locals: mockLocals,
        request,
      } as never);

      expect(response.status).toBe(400);
    });

    it("rejects invalid JSON", async () => {
      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });

      const response = await POST({
        locals: mockLocals,
        request,
      } as never);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid JSON body");
    });

    it("handles database errors", async () => {
      mockWhere.mockRejectedValue(new Error("DB error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new Request("http://test/api/user/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "CA", district: "12" }),
      });

      const response = await POST({
        locals: mockLocals,
        request,
      } as never);

      expect(response.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });

  describe("DELETE /api/user/district", () => {
    it("requires authentication", async () => {
      const response = await DELETE({
        locals: mockLocalsNoUser,
      } as never);

      expect(response.status).toBe(401);
    });

    it("clears saved district", async () => {
      const response = await DELETE({
        locals: mockLocals,
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          savedState: null,
          savedDistrict: null,
        })
      );
    });

    it("handles database errors", async () => {
      mockWhere.mockRejectedValue(new Error("DB error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await DELETE({
        locals: mockLocals,
      } as never);

      expect(response.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });
});
