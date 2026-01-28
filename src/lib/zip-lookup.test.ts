import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  lookupZip,
  getZipData,
  clearCache,
  type ZipLookupResult,
  type ZipData,
} from "./zip-lookup";

const zipDataPath = join(process.cwd(), "public/data/zip-districts.json");
const realZipData: ZipData = JSON.parse(readFileSync(zipDataPath, "utf-8"));

describe("ZIP Lookup", () => {
  beforeEach(() => {
    clearCache();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(realZipData),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getZipData", () => {
    it("fetches ZIP data from JSON file", async () => {
      const data = await getZipData();
      expect(global.fetch).toHaveBeenCalledWith("/data/zip-districts.json");
      expect(data).toEqual(realZipData);
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
      const result = await lookupZip("10128");

      expect(result).toEqual<ZipLookupResult>({
        type: "single",
        state: "NY",
        district: "12",
      });
    });

    it("returns multiple options for ambiguous ZIP (<95% top proportion)", async () => {
      const result = await lookupZip("10003");

      expect(result.type).toBe("ambiguous");
      if (result.type === "ambiguous") {
        expect(result.options).toHaveLength(2);
        expect(result.options[0].state).toBe("NY");
        expect(result.options[0].district).toBe("10");
        expect(result.options[1].district).toBe("12");
      }
    });

    it("sorts ambiguous options by proportion descending", async () => {
      const result = await lookupZip("10003");

      expect(result.type).toBe("ambiguous");
      if (result.type === "ambiguous") {
        expect(result.options[0].proportion).toBeGreaterThan(result.options[1].proportion);
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

    it("handles at-large state districts correctly", async () => {
      const result = await lookupZip("82001");

      expect(result).toEqual<ZipLookupResult>({
        type: "single",
        state: "WY",
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
