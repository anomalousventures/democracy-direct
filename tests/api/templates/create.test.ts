import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/pages/api/templates/index";

describe("Template Creation Endpoint", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mockFetch.mockReset();
  });

  it("accepts anonymous users for template creation", async () => {
    const mockRequest = new Request("http://localhost/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Template",
        body: "This is a test template body that is long enough to pass validation requirements.",
      }),
    });

    const mockLocals = {
      user: null,
      runtime: {
        env: {
          DATABASE_URL: "postgres://test",
          TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        },
      },
    };

    const response = await POST({
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(response.status).not.toBe(401);
  });

  it("returns 400 for missing title", async () => {
    const mockRequest = new Request("http://localhost/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: "This is a test template body that is long enough to pass validation requirements.",
      }),
    });

    const mockLocals = {
      user: { id: "user-123" },
      runtime: {
        env: {
          DATABASE_URL: "postgres://test",
          TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        },
      },
    };

    const response = await POST({
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 for validation errors", async () => {
    const mockRequest = new Request("http://localhost/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Hi",
        body: "Too short",
      }),
    });

    const mockLocals = {
      user: { id: "user-123" },
      runtime: {
        env: {
          DATABASE_URL: "postgres://test",
          TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        },
      },
    };

    const response = await POST({
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Validation failed");
    expect(data.errors).toBeDefined();
  });
});
