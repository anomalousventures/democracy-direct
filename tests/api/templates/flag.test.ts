import { describe, it, expect } from "vitest";
import { POST } from "@/pages/api/templates/[slug]/flag";

describe("Template Flag Endpoint", () => {
  it("returns 401 when not authenticated", async () => {
    const mockRequest = new Request("http://localhost/api/templates/test-slug/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "spam" }),
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
      params: { slug: "test-slug" },
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 400 for missing turnstile token", async () => {
    const mockRequest = new Request("http://localhost/api/templates/test-slug/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "spam" }),
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
      params: { slug: "test-slug" },
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 for invalid flag reason", async () => {
    const mockRequest = new Request("http://localhost/api/templates/test-slug/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "invalid_reason", turnstileToken: "test-token" }),
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
      params: { slug: "test-slug" },
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid flag reason");
    expect(data.validReasons).toBeDefined();
  });

  it("returns 400 for missing slug", async () => {
    const mockRequest = new Request("http://localhost/api/templates//flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "spam" }),
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
      params: { slug: undefined },
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Template slug is required");
  });
});
