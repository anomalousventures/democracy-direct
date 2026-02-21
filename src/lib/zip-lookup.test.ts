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
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/data/zip-manifest.json") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ file: "zip-districts-abc12345.json" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(realZipData),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getZipData", () => {
    it("fetches manifest then hashed ZIP data file", async () => {
      const data = await getZipData();
      expect(global.fetch).toHaveBeenCalledWith("/data/zip-manifest.json");
      expect(global.fetch).toHaveBeenCalledWith("/data/zip-districts-abc12345.json");
      expect(data).toEqual(realZipData);
    });

    it("falls back to bare filename when manifest fails", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url === "/data/zip-manifest.json") {
          return Promise.resolve({ ok: false, status: 404 });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(realZipData),
        });
      });

      const data = await getZipData();
      expect(global.fetch).toHaveBeenCalledWith("/data/zip-districts.json");
      expect(data).toEqual(realZipData);
    });

    it("caches data after first fetch", async () => {
      await getZipData();
      await getZipData();
      await getZipData();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("throws error when data fetch fails", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url === "/data/zip-manifest.json") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ file: "zip-districts-abc12345.json" }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });
      });

      await expect(getZipData()).rejects.toThrow("Failed to load ZIP data");
    });
  });

  describe("lookupZip", () => {
    it("returns single district for ZIP with only one district", async () => {
      const result = await lookupZip("10001");

      expect(result).toEqual<ZipLookupResult>({
        type: "single",
        state: "NY",
        district: "12",
      });
    });

    it("returns multiple options for ZIP spanning multiple districts", async () => {
      const result = await lookupZip("10003");

      expect(result.type).toBe("ambiguous");
      if (result.type === "ambiguous") {
        expect(result.options).toHaveLength(2);
        expect(result.options[0].state).toBe("NY");
        expect(result.options[0].district).toBe("10");
        expect(result.options[1].district).toBe("12");
      }
    });

    it("returns ambiguous even when one district is dominant", async () => {
      const result = await lookupZip("10128");

      expect(result.type).toBe("ambiguous");
      if (result.type === "ambiguous") {
        expect(result.options).toHaveLength(2);
        expect(result.options[0].proportion).toBeGreaterThan(0.95);
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
        message:
          "We don't have district data for this ZIP code. This may be a PO Box, military, or very new ZIP. You can find your representatives at congress.gov by searching your address.",
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

    describe("leading zeros", () => {
      it("handles ZIP codes starting with 0 (Massachusetts)", async () => {
        const result = await lookupZip("01001");

        expect(result.type).not.toBe("error");
        if (result.type === "single" || result.type === "ambiguous") {
          const state = result.type === "single" ? result.state : result.options[0].state;
          expect(state).toBe("MA");
        }
      });

      it("handles ZIP codes starting with 0 (New Hampshire)", async () => {
        const result = await lookupZip("03101");

        expect(result.type).not.toBe("error");
        if (result.type === "single" || result.type === "ambiguous") {
          const state = result.type === "single" ? result.state : result.options[0].state;
          expect(state).toBe("NH");
        }
      });

      it("handles ZIP codes starting with 0 (Maine)", async () => {
        const result = await lookupZip("04101");

        expect(result.type).not.toBe("error");
        if (result.type === "single" || result.type === "ambiguous") {
          const state = result.type === "single" ? result.state : result.options[0].state;
          expect(state).toBe("ME");
        }
      });

      it("handles ZIP codes starting with 0 (Vermont)", async () => {
        const result = await lookupZip("05401");

        expect(result.type).not.toBe("error");
        if (result.type === "single" || result.type === "ambiguous") {
          const state = result.type === "single" ? result.state : result.options[0].state;
          expect(state).toBe("VT");
        }
      });

      it("handles ZIP codes starting with 00 (Puerto Rico)", async () => {
        const result = await lookupZip("00601");

        expect(result.type).not.toBe("error");
        if (result.type === "single" || result.type === "ambiguous") {
          const state = result.type === "single" ? result.state : result.options[0].state;
          expect(state).toBe("PR");
        }
      });
    });

    describe("edge cases", () => {
      it("returns error for ZIP with only 4 digits", async () => {
        const result = await lookupZip("1234");
        expect(result.type).toBe("error");
      });

      it("returns error for ZIP with 6 digits", async () => {
        const result = await lookupZip("123456");
        expect(result.type).toBe("error");
      });

      it("returns error for empty string", async () => {
        const result = await lookupZip("");
        expect(result.type).toBe("error");
      });

      it("returns error for ZIP with spaces in middle", async () => {
        const result = await lookupZip("100 01");
        expect(result.type).toBe("error");
      });

      it("returns error for ZIP with dashes", async () => {
        const result = await lookupZip("10001-1234");
        expect(result.type).toBe("error");
      });
    });
  });
});
