import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/pages/api/templates/search";

vi.mock("@/db/queries/templates", () => ({
  searchTemplatesWithCursor: vi.fn(),
  getApprovedTagNames: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => ({})),
}));

import { searchTemplatesWithCursor, getApprovedTagNames } from "@/db/queries/templates";

describe("Template Search API Endpoint", () => {
  const mockSearchTemplatesWithCursor = vi.mocked(searchTemplatesWithCursor);
  const mockGetApprovedTagNames = vi.mocked(getApprovedTagNames);

  const mockLocals = {
    user: null,
    runtime: {
      env: {
        DATABASE_URL: "postgres://test",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchTemplatesWithCursor.mockResolvedValue({
      items: [
        {
          id: "template-1",
          slug: "test-template",
          title: "Test Template",
          description: "A test template",
          body: "Template body content",
          viewCount: 100,
          useCount: 50,
          createdAt: new Date("2025-01-15"),
          tags: ["healthcare"],
        },
      ],
      nextCursor: null,
      hasMore: false,
    });
    mockGetApprovedTagNames.mockResolvedValue(["healthcare", "education"]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns search results with default parameters", async () => {
    const url = new URL("http://localhost/api/templates/search");
    const mockRequest = new Request(url.toString());

    const response = await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.templates).toHaveLength(1);
    expect(data.templates[0].title).toBe("Test Template");
    expect(data.pagination.hasMore).toBe(false);
    expect(data.availableTags).toEqual(["healthcare", "education"]);
  });

  it("passes limit parameter to query", async () => {
    const url = new URL("http://localhost/api/templates/search?limit=10");
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 10 })
    );
  });

  it("caps limit at 100", async () => {
    const url = new URL("http://localhost/api/templates/search?limit=500");
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 100 })
    );
  });

  it("returns 400 for invalid limit", async () => {
    const url = new URL("http://localhost/api/templates/search?limit=abc");
    const mockRequest = new Request(url.toString());

    const response = await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid limit parameter");
  });

  it("returns 400 for zero limit", async () => {
    const url = new URL("http://localhost/api/templates/search?limit=0");
    const mockRequest = new Request(url.toString());

    const response = await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid limit parameter");
  });

  it("passes cursor parameter to query", async () => {
    const url = new URL("http://localhost/api/templates/search?cursor=abc123");
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ cursor: "abc123" })
    );
  });

  it("passes search parameter to query", async () => {
    const url = new URL("http://localhost/api/templates/search?search=healthcare");
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ search: "healthcare" })
    );
  });

  it("passes tags parameter as array to query", async () => {
    const url = new URL("http://localhost/api/templates/search?tags=healthcare,education");
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tags: ["healthcare", "education"] })
    );
  });

  it("handles empty tags parameter", async () => {
    const url = new URL("http://localhost/api/templates/search?tags=");
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tags: undefined })
    );
  });

  it("trims whitespace from tags", async () => {
    const url = new URL("http://localhost/api/templates/search?tags= healthcare , education ");
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tags: ["healthcare", "education"] })
    );
  });

  it("returns pagination info with nextCursor when hasMore is true", async () => {
    mockSearchTemplatesWithCursor.mockResolvedValue({
      items: [
        {
          id: "template-1",
          slug: "test-template",
          title: "Test Template",
          description: "A test template",
          body: "Template body content",
          viewCount: 100,
          useCount: 50,
          createdAt: new Date("2025-01-15"),
          tags: ["healthcare"],
        },
      ],
      nextCursor: "next-cursor-token",
      hasMore: true,
    });

    const url = new URL("http://localhost/api/templates/search");
    const mockRequest = new Request(url.toString());

    const response = await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    const data = await response.json();
    expect(data.pagination.hasMore).toBe(true);
    expect(data.pagination.nextCursor).toBe("next-cursor-token");
  });

  it("returns 500 on database error", async () => {
    mockSearchTemplatesWithCursor.mockRejectedValue(new Error("Database connection failed"));

    const url = new URL("http://localhost/api/templates/search");
    const mockRequest = new Request(url.toString());

    const response = await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to search templates");
  });

  it("combines all query parameters", async () => {
    const url = new URL(
      "http://localhost/api/templates/search?limit=5&cursor=abc&search=test&tags=healthcare"
    );
    const mockRequest = new Request(url.toString());

    await GET({
      url,
      request: mockRequest,
      locals: mockLocals,
    } as never);

    expect(mockSearchTemplatesWithCursor).toHaveBeenCalledWith(expect.anything(), {
      limit: 5,
      cursor: "abc",
      search: "test",
      tags: ["healthcare"],
    });
  });
});
