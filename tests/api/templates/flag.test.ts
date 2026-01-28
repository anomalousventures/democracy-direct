import { describe, it, expect } from "vitest";

describe("Template Flag Endpoint", () => {
  it("returns 401 when not authenticated", async () => {
    const { POST } = await import("@/pages/api/templates/[slug]/flag");

    const mockRequest = new Request("http://localhost/api/templates/test-slug/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "spam" }),
    });

    const mockLocals = {
      user: null,
      runtime: { env: { DATABASE_URL: "postgres://test" } },
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

  it("returns 400 for invalid flag reason", async () => {
    const { POST } = await import("@/pages/api/templates/[slug]/flag");

    const mockRequest = new Request("http://localhost/api/templates/test-slug/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "invalid_reason" }),
    });

    const mockLocals = {
      user: { id: "user-123" },
      runtime: { env: { DATABASE_URL: "postgres://test" } },
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
    const { POST } = await import("@/pages/api/templates/[slug]/flag");

    const mockRequest = new Request("http://localhost/api/templates//flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "spam" }),
    });

    const mockLocals = {
      user: { id: "user-123" },
      runtime: { env: { DATABASE_URL: "postgres://test" } },
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

  it("exports POST function", async () => {
    const { POST } = await import("@/pages/api/templates/[slug]/flag");
    expect(typeof POST).toBe("function");
  });
});
