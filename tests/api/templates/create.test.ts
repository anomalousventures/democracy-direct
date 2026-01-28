import { describe, it, expect } from "vitest";
import { POST } from "@/pages/api/templates/index";

describe("Template Creation Endpoint", () => {
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
          TURNSTILE_SITE_KEY: "test-site-key",
          TURNSTILE_SECRET_KEY: "test-secret",
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
          TURNSTILE_SITE_KEY: "test-site-key",
          TURNSTILE_SECRET_KEY: "test-secret",
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
          TURNSTILE_SITE_KEY: "test-site-key",
          TURNSTILE_SECRET_KEY: "test-secret",
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
