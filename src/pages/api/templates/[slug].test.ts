import { describe, it, expect } from "vitest";

describe("GET /api/templates/[slug]", () => {
  it("returns 400 when slug is missing", async () => {
    const { GET } = await import("./[slug]");

    const response = await GET({
      params: {},
      locals: {
        user: null,
        runtime: { env: { DATABASE_URL: "postgres://test" } },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Slug is required");
  });

  it("exports GET function", async () => {
    const { GET } = await import("./[slug]");
    expect(typeof GET).toBe("function");
  });
});

describe("PUT /api/templates/[slug]", () => {
  it("returns 401 when not authenticated", async () => {
    const { PUT } = await import("./[slug]");

    const response = await PUT({
      params: { slug: "test-template" },
      locals: {
        user: null,
        runtime: { env: { DATABASE_URL: "postgres://test" } },
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
    const { PUT } = await import("./[slug]");

    const response = await PUT({
      params: {},
      locals: {
        user: { id: "user-123" },
        runtime: { env: { DATABASE_URL: "postgres://test" } },
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
    const { PUT } = await import("./[slug]");

    const response = await PUT({
      params: { slug: "test-template" },
      locals: {
        user: { id: "user-123" },
        runtime: { env: { DATABASE_URL: "postgres://test" } },
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
    const { PUT } = await import("./[slug]");

    const response = await PUT({
      params: { slug: "test-template" },
      locals: {
        user: { id: "user-123" },
        runtime: { env: { DATABASE_URL: "postgres://test" } },
      },
      request: new Request("http://localhost/api/templates/test-template", {
        method: "PUT",
        body: JSON.stringify({ title: "" }),
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Title and body are required");
  });

  it("returns 400 for validation errors", async () => {
    const { PUT } = await import("./[slug]");

    const response = await PUT({
      params: { slug: "test-template" },
      locals: {
        user: { id: "user-123" },
        runtime: { env: { DATABASE_URL: "postgres://test" } },
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

  it("exports PUT function", async () => {
    const { PUT } = await import("./[slug]");
    expect(typeof PUT).toBe("function");
  });
});

describe("DELETE /api/templates/[slug]", () => {
  it("returns 401 when not authenticated", async () => {
    const { DELETE } = await import("./[slug]");

    const response = await DELETE({
      params: { slug: "test-template" },
      locals: {
        user: null,
        runtime: { env: { DATABASE_URL: "postgres://test" } },
      },
    } as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 400 when slug is missing", async () => {
    const { DELETE } = await import("./[slug]");

    const response = await DELETE({
      params: {},
      locals: {
        user: { id: "user-123" },
        runtime: { env: { DATABASE_URL: "postgres://test" } },
      },
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Slug is required");
  });

  it("exports DELETE function", async () => {
    const { DELETE } = await import("./[slug]");
    expect(typeof DELETE).toBe("function");
  });
});
