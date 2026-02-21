import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/pages/api/rep/by-district";

const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => ({
    query: {
      legislators: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
    },
  })),
}));

const mockLogError = vi.fn();
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({ error: mockLogError })),
}));

const mockLocals = {
  runtime: {
    env: {
      DATABASE_URL: "postgres://test",
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
};

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://test/api/rep/by-district");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return { url, locals: mockLocals, request: new Request(url) } as never;
}

const mockRep = {
  bioguideId: "S000148",
  fullName: "Chuck Schumer",
  party: "Democrat",
  state: "NY",
  district: "12",
};

const mockSenator = {
  bioguideId: "S000148",
  fullName: "Chuck Schumer",
  party: "Democrat",
  state: "NY",
  district: null,
};

describe("GET /api/rep/by-district", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns rep data for valid state and district", async () => {
    mockFindFirst.mockResolvedValue(mockRep);

    const response = await GET(makeRequest({ state: "NY", district: "12" }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.bioguideId).toBe("S000148");
    expect(data.fullName).toBe("Chuck Schumer");
    expect(data.party).toBe("Democrat");
  });

  it("returns 404 for unknown district", async () => {
    mockFindFirst.mockResolvedValue(null);

    const response = await GET(makeRequest({ state: "NY", district: "99" }));

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("No representative found");
  });

  it("handles at-large district (00)", async () => {
    const atLargeRep = { ...mockRep, district: "0" };
    mockFindFirst.mockResolvedValue(atLargeRep);

    const response = await GET(makeRequest({ state: "VT", district: "00" }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.bioguideId).toBe("S000148");
  });

  it("handles at-large district (AL)", async () => {
    mockFindFirst.mockResolvedValue({ ...mockRep, district: "AL" });

    const response = await GET(makeRequest({ state: "VT", district: "AL" }));

    expect(response.status).toBe(200);
  });

  it("returns 400 when state is missing", async () => {
    const response = await GET(makeRequest({ district: "12" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("state and district");
  });

  it("returns 400 when district is missing", async () => {
    const response = await GET(makeRequest({ state: "NY" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("state and district");
  });

  it("returns 400 for invalid state code", async () => {
    const response = await GET(makeRequest({ state: "XX", district: "12" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid state code");
  });

  it("returns 400 for invalid district format", async () => {
    const response = await GET(makeRequest({ state: "NY", district: "abc" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid district");
  });

  it("uppercases state parameter", async () => {
    mockFindFirst.mockResolvedValue(mockRep);

    const response = await GET(makeRequest({ state: "ny", district: "12" }));

    expect(response.status).toBe(200);
    expect(mockFindFirst).toHaveBeenCalled();
  });

  it("returns senators when chamber=senate", async () => {
    mockFindMany.mockResolvedValue([mockSenator]);

    const response = await GET(makeRequest({ state: "NY", chamber: "senate" }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns 404 when no senators found", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET(makeRequest({ state: "NY", chamber: "senate" }));

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("No senators found");
  });

  it("returns 400 for senate request without state", async () => {
    const response = await GET(makeRequest({ chamber: "senate" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("state query parameter is required");
  });

  it("returns 400 for senate request with invalid state", async () => {
    const response = await GET(makeRequest({ state: "XX", chamber: "senate" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid state code");
  });

  it("handles database errors gracefully", async () => {
    mockFindFirst.mockRejectedValue(new Error("DB connection failed"));

    const response = await GET(makeRequest({ state: "NY", district: "12" }));

    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalledWith(
      "house_rep_fetch_failed",
      expect.objectContaining({ state: "NY", district: "12" })
    );
  });

  it("handles database errors for senate requests", async () => {
    mockFindMany.mockRejectedValue(new Error("DB connection failed"));

    const response = await GET(makeRequest({ state: "NY", chamber: "senate" }));

    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalledWith(
      "senators_fetch_failed",
      expect.objectContaining({ state: "NY" })
    );
  });

  it("has prerender set to false", async () => {
    const module = await import("@/pages/api/rep/by-district");
    expect(module.prerender).toBe(false);
  });
});
