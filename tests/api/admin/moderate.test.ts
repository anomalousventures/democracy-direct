import { describe, it, expect } from "vitest";
import { POST } from "@/pages/api/admin/moderate/[templateId]";
import { ADMIN_TRUST_LEVEL } from "@/lib/admin";

describe("POST /api/admin/moderate/[templateId]", () => {
  it("returns 401 when not authenticated", async () => {
    const response = await POST({
      params: { templateId: "template-123" },
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
      request: new Request("http://localhost/api/admin/moderate/template-123", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
    } as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 403 for non-admin user", async () => {
    const response = await POST({
      params: { templateId: "template-123" },
      locals: {
        user: { id: "user-123", trustLevel: 1 },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
      request: new Request("http://localhost/api/admin/moderate/template-123", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
    } as never);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Admin access required");
  });

  it("returns 400 when templateId is missing", async () => {
    const response = await POST({
      params: {},
      locals: {
        user: { id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
      request: new Request("http://localhost/api/admin/moderate/", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Template ID is required");
  });

  it("returns 400 for invalid action", async () => {
    const response = await POST({
      params: { templateId: "template-123" },
      locals: {
        user: { id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
      request: new Request("http://localhost/api/admin/moderate/template-123", {
        method: "POST",
        body: JSON.stringify({ action: "invalid" }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST({
      params: { templateId: "template-123" },
      locals: {
        user: { id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
      request: new Request("http://localhost/api/admin/moderate/template-123", {
        method: "POST",
        body: "not valid json",
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON");
  });
});
