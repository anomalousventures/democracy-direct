import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/tags/suggest";

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => mockDb),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

function resetMockDb() {
  Object.values(mockDb).forEach((fn) => fn.mockReset());
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.insert.mockReturnThis();
  mockDb.values.mockReturnThis();
}

const createLocals = (userId: string | null) => ({
  user: userId ? { id: userId } : null,
  runtime: {
    env: {
      DATABASE_URL: "postgres://test",
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
});

describe("Tag Suggestion API", () => {
  beforeEach(() => {
    resetMockDb();
  });

  describe("POST /api/tags/suggest", () => {
    it("creates tag suggestion for authenticated user", async () => {
      mockDb.where.mockResolvedValue([]);
      mockDb.returning.mockResolvedValue([
        { id: "1", name: "healthcare", status: "pending", suggestedBy: "user-123" },
      ]);

      const response = await POST({
        locals: createLocals("user-123"),
        request: new Request("http://localhost/api/tags/suggest", {
          method: "POST",
          body: JSON.stringify({ name: "healthcare" }),
        }),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tag.name).toBe("healthcare");
      expect(data.tag.status).toBe("pending");
    });

    it("requires authentication for tag suggestions", async () => {
      const response = await POST({
        locals: createLocals(null),
        request: new Request("http://localhost/api/tags/suggest", {
          method: "POST",
          body: JSON.stringify({ name: "education" }),
        }),
      } as never);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Authentication required");
    });

    it("returns 400 for invalid tag name", async () => {
      const response = await POST({
        locals: createLocals("user-123"),
        request: new Request("http://localhost/api/tags/suggest", {
          method: "POST",
          body: JSON.stringify({ name: "" }),
        }),
      } as never);

      expect(response.status).toBe(400);
    });

    it("returns 409 if tag already exists", async () => {
      mockDb.where
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "existing", name: "healthcare" }]);

      const response = await POST({
        locals: createLocals("user-123"),
        request: new Request("http://localhost/api/tags/suggest", {
          method: "POST",
          body: JSON.stringify({ name: "healthcare" }),
        }),
      } as never);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain("already exists");
    });

    it("returns 429 when rate limit exceeded", async () => {
      mockDb.where.mockResolvedValueOnce([
        { id: "1" },
        { id: "2" },
        { id: "3" },
        { id: "4" },
        { id: "5" },
      ]);

      const response = await POST({
        locals: createLocals("user-123"),
        request: new Request("http://localhost/api/tags/suggest", {
          method: "POST",
          body: JSON.stringify({ name: "newtag" }),
        }),
      } as never);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toContain("Too many suggestions");
    });
  });
});
