import { describe, it, expect } from "vitest";
import { formatDistrictDisplay, isValidSavedDistrict } from "./saved-district";

describe("saved-district helpers", () => {
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

  describe("isValidSavedDistrict", () => {
    it("returns true for valid district objects", () => {
      expect(isValidSavedDistrict({ state: "CA", district: "12" })).toBe(true);
      expect(isValidSavedDistrict({ state: "WY", district: "AL" })).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidSavedDistrict(null)).toBe(false);
    });

    it("returns false for non-objects", () => {
      expect(isValidSavedDistrict("string")).toBe(false);
      expect(isValidSavedDistrict(123)).toBe(false);
      expect(isValidSavedDistrict(undefined)).toBe(false);
    });

    it("returns false for objects missing state", () => {
      expect(isValidSavedDistrict({ district: "12" })).toBe(false);
    });

    it("returns false for objects missing district", () => {
      expect(isValidSavedDistrict({ state: "CA" })).toBe(false);
    });

    it("returns false for objects with non-string state", () => {
      expect(isValidSavedDistrict({ state: 123, district: "12" })).toBe(false);
    });

    it("returns false for objects with non-string district", () => {
      expect(isValidSavedDistrict({ state: "CA", district: 12 })).toBe(false);
    });
  });
});
