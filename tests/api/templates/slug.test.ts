import { describe, it, expect } from "vitest";
import { GET, PUT, DELETE } from "@/pages/api/templates/[slug]";

describe("GET /api/templates/[slug]", () => {
  it("returns 400 when slug is missing", async () => {
    const response = await GET({
      params: {},
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

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Slug is required");
  });
});

describe("PUT /api/templates/[slug]", () => {
  it("returns 401 when not authenticated", async () => {
    const response = await PUT({
      params: { slug: "test-template" },
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
      request: new Request("http://localhost/api/templates/test-template", {
        method: "PUT",
        body: JSON.stringify({ title: "Test", body: "Test body" }),
      }),
    } as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 400 when slug is missing", async () => {
    const response = await PUT({
      params: {},
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
      request: new Request("http://localhost/api/templates/test", {
        method: "PUT",
        body: JSON.stringify({ title: "Test", body: "Test body" }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Slug is required");
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await PUT({
      params: { slug: "test-template" },
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
      request: new Request("http://localhost/api/templates/test-template", {
        method: "PUT",
        body: "not valid json",
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON");
  });

  it("returns 400 when title or body missing", async () => {
    const response = await PUT({
      params: { slug: "test-template" },
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
      request: new Request("http://localhost/api/templates/test-template", {
        method: "PUT",
        body: JSON.stringify({ title: "" }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("accepts linkedBillNumbers in PUT body", async () => {
    const response = await PUT({
      params: { slug: "test-template" },
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
      request: new Request("http://localhost/api/templates/test-template", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated Template",
          body: "This is an updated template body that is long enough to pass validation requirements.",
          linkedBillNumbers: ["H.R.1234", "S.567"],
        }),
      }),
    } as never);

    expect(response.status).not.toBe(400);
  });

  it("returns 400 for validation errors", async () => {
    const response = await PUT({
      params: { slug: "test-template" },
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
      request: new Request("http://localhost/api/templates/test-template", {
        method: "PUT",
        body: JSON.stringify({ title: "Hi", body: "Short" }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Validation failed");
    expect(data.errors).toBeDefined();
  });
});

describe("DELETE /api/templates/[slug]", () => {
  it("returns 401 when not authenticated", async () => {
    const response = await DELETE({
      params: { slug: "test-template" },
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

  it("returns 400 when slug is missing", async () => {
    const response = await DELETE({
      params: {},
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
    expect(data.error).toBe("Slug is required");
  });
});
