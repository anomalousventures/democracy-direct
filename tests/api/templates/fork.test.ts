import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/pages/api/templates/fork";

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => mockDb),
}));

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

function resetMockDb() {
  Object.values(mockDb).forEach((fn) => fn.mockReset());
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockReturnThis();
  mockDb.insert.mockReturnThis();
  mockDb.values.mockReturnThis();
}

describe("POST /api/templates/fork", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    resetMockDb();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mockFetch.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    const response = await POST({
      request: new Request("http://localhost/api/templates/fork", {
        method: "POST",
        body: JSON.stringify({
          title: "Forked Template",
          body: "This is a forked template body that is long enough to pass validation requirements.",
          forkedFromId: "original-template-id",
        }),
      }),
      locals: {
        user: null,
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
    } as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST({
      request: new Request("http://localhost/api/templates/fork", {
        method: "POST",
        body: "not valid json",
      }),
      locals: {
        user: { id: "user-123" },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON");
  });

  it("returns 400 when title or body missing", async () => {
    const response = await POST({
      request: new Request("http://localhost/api/templates/fork", {
        method: "POST",
        body: JSON.stringify({
          title: "",
          forkedFromId: "original-template-id",
        }),
      }),
      locals: {
        user: { id: "user-123" },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 when forkedFromId is missing", async () => {
    const response = await POST({
      request: new Request("http://localhost/api/templates/fork", {
        method: "POST",
        body: JSON.stringify({
          title: "Forked Template",
          body: "This is a forked template body that is long enough to pass validation requirements.",
        }),
      }),
      locals: {
        user: { id: "user-123" },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Source template ID is required");
  });

  it("returns 400 for validation errors", async () => {
    const response = await POST({
      request: new Request("http://localhost/api/templates/fork", {
        method: "POST",
        body: JSON.stringify({
          title: "Hi",
          body: "Short",
          forkedFromId: "original-template-id",
        }),
      }),
      locals: {
        user: { id: "user-123" },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Validation failed");
    expect(data.errors).toBeDefined();
  });

  // Security: All inaccessible template scenarios return the same 404 response
  // to prevent information leakage about which templates exist, are private, or pending.
  // The database query filters by: exists AND isPublic AND moderationStatus='approved'
  it.each([
    ["non-existent", "non-existent-template-id"],
    ["private", "private-template-id"],
    ["unapproved", "pending-template-id"],
  ])("returns 404 when source template is %s", async (_scenario, forkedFromId) => {
    mockDb.limit.mockResolvedValue([]);

    const response = await POST({
      request: new Request("http://localhost/api/templates/fork", {
        method: "POST",
        body: JSON.stringify({
          title: "Forked Template",
          body: "This is a forked template body that is long enough to pass validation requirements.",
          forkedFromId,
          turnstileToken: "test-token",
        }),
      }),
      locals: {
        user: { id: "user-123" },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
    } as never);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Source template not found");
  });
});
