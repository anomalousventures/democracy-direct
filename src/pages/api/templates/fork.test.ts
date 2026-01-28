import { describe, it, expect } from "vitest";

describe("POST /api/templates/fork", () => {
  it("returns 401 when not authenticated", async () => {
    const { POST } = await import("./fork");

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
        runtime: { env: { DATABASE_URL: "postgres://test", TURNSTILE_SECRET_KEY: "test-secret" } },
      },
    } as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("./fork");

    const response = await POST({
      request: new Request("http://localhost/api/templates/fork", {
        method: "POST",
        body: "not valid json",
      }),
      locals: {
        user: { id: "user-123" },
        runtime: { env: { DATABASE_URL: "postgres://test", TURNSTILE_SECRET_KEY: "test-secret" } },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON");
  });

  it("returns 400 when title or body missing", async () => {
    const { POST } = await import("./fork");

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
        runtime: { env: { DATABASE_URL: "postgres://test", TURNSTILE_SECRET_KEY: "test-secret" } },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Title and body are required");
  });

  it("returns 400 when forkedFromId is missing", async () => {
    const { POST } = await import("./fork");

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
        runtime: { env: { DATABASE_URL: "postgres://test", TURNSTILE_SECRET_KEY: "test-secret" } },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Source template ID is required");
  });

  it("returns 400 for validation errors", async () => {
    const { POST } = await import("./fork");

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
        runtime: { env: { DATABASE_URL: "postgres://test", TURNSTILE_SECRET_KEY: "test-secret" } },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Validation failed");
    expect(data.errors).toBeDefined();
  });

  it("exports POST function", async () => {
    const { POST } = await import("./fork");
    expect(typeof POST).toBe("function");
  });
});
