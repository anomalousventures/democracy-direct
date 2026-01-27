import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { lookupZip, getZipData, clearCache, type ZipLookupResult } from "./zip-lookup";

const mockZipData = {
  "10001": [{ s: "NY", d: "12", p: 1.0 }],
  "10002": [
    { s: "NY", d: "7", p: 0.6 },
    { s: "NY", d: "12", p: 0.4 },
  ],
  "90210": [{ s: "CA", d: "36", p: 0.98 }],
  "85001": [
    { s: "AZ", d: "3", p: 0.45 },
    { s: "AZ", d: "7", p: 0.35 },
    { s: "AZ", d: "9", p: 0.2 },
  ],
  "59001": [{ s: "MT", d: "0", p: 1.0 }],
};

describe("ZIP Lookup", () => {
  beforeEach(() => {
    clearCache();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockZipData),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getZipData", () => {
    it("fetches ZIP data from JSON file", async () => {
      const data = await getZipData();
      expect(global.fetch).toHaveBeenCalledWith("/data/zip-districts.json");
      expect(data).toEqual(mockZipData);
    });

    it("caches data after first fetch", async () => {
      await getZipData();
      await getZipData();
      await getZipData();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("throws error when fetch fails", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(getZipData()).rejects.toThrow("Failed to load ZIP data");
    });
  });

  describe("lookupZip", () => {
    it("returns single district for unambiguous ZIP (100% proportion)", async () => {
      const result = await lookupZip("10001");

      expect(result).toEqual<ZipLookupResult>({
        type: "single",
        state: "NY",
        district: "12",
      });
    });

    it("returns single district for ZIP with >95% proportion", async () => {
      const result = await lookupZip("90210");

      expect(result).toEqual<ZipLookupResult>({
        type: "single",
        state: "CA",
        district: "36",
      });
    });

    it("returns multiple options for ambiguous ZIP (<95% top proportion)", async () => {
      const result = await lookupZip("10002");

      expect(result).toEqual<ZipLookupResult>({
        type: "ambiguous",
        options: [
          { state: "NY", district: "7", proportion: 0.6 },
          { state: "NY", district: "12", proportion: 0.4 },
        ],
      });
    });

    it("sorts ambiguous options by proportion descending", async () => {
      const result = await lookupZip("85001");

      expect(result.type).toBe("ambiguous");
      if (result.type === "ambiguous") {
        expect(result.options[0].proportion).toBe(0.45);
        expect(result.options[1].proportion).toBe(0.35);
        expect(result.options[2].proportion).toBe(0.2);
      }
    });

    it("returns error for invalid ZIP format", async () => {
      const result = await lookupZip("1234");

      expect(result).toEqual<ZipLookupResult>({
        type: "error",
        message: "Invalid ZIP code format. Please enter a 5-digit ZIP code.",
      });
    });

    it("returns error for non-numeric ZIP", async () => {
      const result = await lookupZip("abcde");

      expect(result).toEqual<ZipLookupResult>({
        type: "error",
        message: "Invalid ZIP code format. Please enter a 5-digit ZIP code.",
      });
    });

    it("returns error for unknown ZIP", async () => {
      const result = await lookupZip("00000");

      expect(result).toEqual<ZipLookupResult>({
        type: "error",
        message: "ZIP code not found. Please check the ZIP code and try again.",
      });
    });

    it("handles at-large districts correctly", async () => {
      const result = await lookupZip("59001");

      expect(result).toEqual<ZipLookupResult>({
        type: "single",
        state: "MT",
        district: "0",
      });
    });

    it("trims whitespace from input", async () => {
      const result = await lookupZip("  10001  ");

      expect(result).toEqual<ZipLookupResult>({
        type: "single",
        state: "NY",
        district: "12",
      });
    });
  });
});
