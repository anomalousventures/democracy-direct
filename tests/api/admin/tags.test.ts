import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/pages/api/admin/tags";

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => mockDb),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

function resetMockDb() {
  Object.values(mockDb).forEach((fn) => fn.mockReset());
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockReturnThis();
  mockDb.insert.mockReturnThis();
  mockDb.values.mockReturnThis();
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
}

const adminLocals = {
  user: { id: "admin-123", trustLevel: 2 },
  runtime: {
    env: {
      DATABASE_URL: "postgres://test",
      TURNSTILE_SITE_KEY: "test-site-key",
      TURNSTILE_SECRET_KEY: "test-secret",
    },
  },
};

const nonAdminLocals = {
  user: { id: "user-456", trustLevel: 0 },
  runtime: {
    env: {
      DATABASE_URL: "postgres://test",
      TURNSTILE_SITE_KEY: "test-site-key",
      TURNSTILE_SECRET_KEY: "test-secret",
    },
  },
};

describe("Tag Suggestions Admin API", () => {
  beforeEach(() => {
    resetMockDb();
  });

  describe("GET /api/admin/tags", () => {
    it("returns 403 for non-admin users", async () => {
      const response = await GET({ locals: nonAdminLocals } as never);
      expect(response.status).toBe(403);
    });

    it("returns pending tag suggestions for admin", async () => {
      const mockTags = [
        { id: "1", name: "healthcare", status: "pending", createdAt: new Date() },
        { id: "2", name: "education", status: "pending", createdAt: new Date() },
      ];
      mockDb.orderBy.mockResolvedValue(mockTags);

      const response = await GET({ locals: adminLocals } as never);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tags).toHaveLength(2);
    });
  });

  describe("POST /api/admin/tags", () => {
    const validTagId = "550e8400-e29b-41d4-a716-446655440000";

    it("returns 403 for non-admin users", async () => {
      const response = await POST({
        locals: nonAdminLocals,
        request: new Request("http://localhost/api/admin/tags", {
          method: "POST",
          body: JSON.stringify({ tagId: validTagId, action: "approve" }),
        }),
      } as never);
      expect(response.status).toBe(403);
    });

    it("approves tag suggestion when admin clicks approve", async () => {
      mockDb.returning.mockResolvedValue([
        { id: validTagId, name: "healthcare", status: "approved" },
      ]);

      const response = await POST({
        locals: adminLocals,
        request: new Request("http://localhost/api/admin/tags", {
          method: "POST",
          body: JSON.stringify({ tagId: validTagId, action: "approve" }),
        }),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tag.status).toBe("approved");
    });

    it("rejects tag suggestion when admin clicks reject", async () => {
      mockDb.returning.mockResolvedValue([{ id: validTagId, name: "spam", status: "rejected" }]);

      const response = await POST({
        locals: adminLocals,
        request: new Request("http://localhost/api/admin/tags", {
          method: "POST",
          body: JSON.stringify({ tagId: validTagId, action: "reject" }),
        }),
      } as never);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tag.status).toBe("rejected");
    });
  });
});
