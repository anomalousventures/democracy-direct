import { describe, it, expect } from "vitest";
import { PATCH } from "@/pages/api/admin/users/[userId]";
import { ADMIN_TRUST_LEVEL } from "@/lib/admin";

describe("PATCH /api/admin/users/[userId]", () => {
  it("returns 401 when not authenticated", async () => {
    const response = await PATCH({
      params: { userId: "user-123" },
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
      request: new Request("http://localhost/api/admin/users/user-123", {
        method: "PATCH",
        body: JSON.stringify({ trustLevel: 1 }),
      }),
    } as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 403 for non-admin user", async () => {
    const response = await PATCH({
      params: { userId: "user-123" },
      locals: {
        user: { id: "other-user", trustLevel: 1 },
        runtime: {
          env: {
            DATABASE_URL: "postgres://test",
            TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        },
      },
      request: new Request("http://localhost/api/admin/users/user-123", {
        method: "PATCH",
        body: JSON.stringify({ trustLevel: 1 }),
      }),
    } as never);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Admin access required");
  });

  it("returns 400 when userId is missing", async () => {
    const response = await PATCH({
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
      request: new Request("http://localhost/api/admin/users/", {
        method: "PATCH",
        body: JSON.stringify({ trustLevel: 1 }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("User ID is required");
  });

  it("returns 400 for invalid trust level", async () => {
    const response = await PATCH({
      params: { userId: "user-123" },
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
      request: new Request("http://localhost/api/admin/users/user-123", {
        method: "PATCH",
        body: JSON.stringify({ trustLevel: 99 }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("prevents admin from demoting themselves", async () => {
    const response = await PATCH({
      params: { userId: "admin-123" },
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
      request: new Request("http://localhost/api/admin/users/admin-123", {
        method: "PATCH",
        body: JSON.stringify({ trustLevel: 0 }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Cannot demote yourself");
  });
});
