import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getSavedDistrict,
  setSavedDistrict,
  clearSavedDistrict,
  formatDistrictDisplay,
} from "./saved-district";

describe("saved-district localStorage helpers", () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getSavedDistrict", () => {
    it("returns null when nothing is stored", () => {
      expect(getSavedDistrict()).toBeNull();
    });

    it("returns stored district data", () => {
      mockStorage["democracy-direct-district"] = JSON.stringify({
        state: "CA",
        district: "12",
      });
      expect(getSavedDistrict()).toEqual({ state: "CA", district: "12" });
    });

    it("returns null for invalid JSON", () => {
      mockStorage["democracy-direct-district"] = "not-json";
      expect(getSavedDistrict()).toBeNull();
    });

    it("returns null for incomplete data", () => {
      mockStorage["democracy-direct-district"] = JSON.stringify({ state: "CA" });
      expect(getSavedDistrict()).toBeNull();
    });

    it("returns null for wrong types", () => {
      mockStorage["democracy-direct-district"] = JSON.stringify({
        state: 123,
        district: "12",
      });
      expect(getSavedDistrict()).toBeNull();
    });
  });

  describe("setSavedDistrict", () => {
    it("stores district data", () => {
      setSavedDistrict("CA", "12");
      expect(mockStorage["democracy-direct-district"]).toBe(
        JSON.stringify({ state: "CA", district: "12" })
      );
    });

    it("uppercases state and district", () => {
      setSavedDistrict("ca", "al");
      expect(mockStorage["democracy-direct-district"]).toBe(
        JSON.stringify({ state: "CA", district: "AL" })
      );
    });
  });

  describe("clearSavedDistrict", () => {
    it("removes stored district data", () => {
      mockStorage["democracy-direct-district"] = JSON.stringify({
        state: "CA",
        district: "12",
      });
      clearSavedDistrict();
      expect(mockStorage["democracy-direct-district"]).toBeUndefined();
    });

    it("does nothing if nothing is stored", () => {
      clearSavedDistrict();
      expect(mockStorage["democracy-direct-district"]).toBeUndefined();
    });
  });

  describe("formatDistrictDisplay", () => {
    it("formats regular districts", () => {
      expect(formatDistrictDisplay("CA", "12")).toBe("CA-12");
      expect(formatDistrictDisplay("NY", "3")).toBe("NY-3");
    });

    it("formats at-large districts", () => {
      expect(formatDistrictDisplay("WY", "AL")).toBe("WY At-Large");
      expect(formatDistrictDisplay("VT", "0")).toBe("VT At-Large");
      expect(formatDistrictDisplay("AK", "00")).toBe("AK At-Large");
    });
  });
});
