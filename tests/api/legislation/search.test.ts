import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/pages/api/legislation/search";

vi.mock("@/db/queries/bills", () => ({
  searchBills: vi.fn(),
  getBills: vi.fn(),
  getBillCount: vi.fn(),
  getDistinctSubjects: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => ({})),
}));

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(() => ({ database: { url: "postgres://test" } })),
}));

import { searchBills, getBills, getBillCount, getDistinctSubjects } from "@/db/queries/bills";

describe("Legislation Search API", () => {
  const mockGetBills = vi.mocked(getBills);
  const mockSearchBills = vi.mocked(searchBills);
  const mockGetBillCount = vi.mocked(getBillCount);
  const mockGetDistinctSubjects = vi.mocked(getDistinctSubjects);

  const mockLocals = {
    runtime: { env: { DATABASE_URL: "postgres://test" } },
  };

  function callGET(urlString: string) {
    const url = new URL(urlString);
    return GET({
      url,
      request: new Request(url.toString()),
      locals: mockLocals,
    } as never);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBills.mockResolvedValue([]);
    mockSearchBills.mockResolvedValue([]);
    mockGetBillCount.mockResolvedValue(0);
    mockGetDistinctSubjects.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("status param", () => {
    it("accepts a single status", async () => {
      const response = await callGET("http://localhost/api/legislation/search?status=introduced");
      expect(response.status).toBe(200);
      expect(mockGetBills).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statuses: ["introduced"] })
      );
    });

    it("accepts multiple comma-separated statuses", async () => {
      const response = await callGET(
        "http://localhost/api/legislation/search?status=introduced,became_law"
      );
      expect(response.status).toBe(200);
      expect(mockGetBills).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statuses: ["introduced", "became_law"] })
      );
    });

    it("returns 400 for an invalid status", async () => {
      const response = await callGET("http://localhost/api/legislation/search?status=not_a_status");
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid status parameter");
    });

    it("returns 400 when any value in a comma list is invalid", async () => {
      const response = await callGET(
        "http://localhost/api/legislation/search?status=introduced,bogus"
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid status parameter");
    });
  });

  describe("type param", () => {
    it("accepts a single type", async () => {
      const response = await callGET("http://localhost/api/legislation/search?type=hr");
      expect(response.status).toBe(200);
      expect(mockGetBills).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ billTypes: ["hr"] })
      );
    });

    it("accepts multiple comma-separated types", async () => {
      const response = await callGET("http://localhost/api/legislation/search?type=hr,s");
      expect(response.status).toBe(200);
      expect(mockGetBills).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ billTypes: ["hr", "s"] })
      );
    });

    it("returns 400 for an invalid type", async () => {
      const response = await callGET("http://localhost/api/legislation/search?type=fake");
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid type parameter");
    });

    it("returns 400 when any value in a comma list is invalid", async () => {
      const response = await callGET("http://localhost/api/legislation/search?type=hr,fake");
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid type parameter");
    });
  });

  describe("subject param", () => {
    it("splits comma-separated subjects", async () => {
      const response = await callGET(
        "http://localhost/api/legislation/search?subject=Health,Education"
      );
      expect(response.status).toBe(200);
      expect(mockGetBills).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ subjects: ["Health", "Education"] })
      );
    });

    it("trims whitespace from subjects", async () => {
      const response = await callGET(
        "http://localhost/api/legislation/search?subject= Health , Education "
      );
      expect(response.status).toBe(200);
      expect(mockGetBills).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ subjects: ["Health", "Education"] })
      );
    });
  });

  describe("search query with filters", () => {
    it("passes filters through to searchBills when q is provided", async () => {
      const response = await callGET(
        "http://localhost/api/legislation/search?q=tax&status=introduced&type=hr"
      );
      expect(response.status).toBe(200);
      expect(mockSearchBills).toHaveBeenCalledWith(
        expect.anything(),
        "tax",
        expect.objectContaining({
          statuses: ["introduced"],
          billTypes: ["hr"],
        })
      );
    });
  });
});
