import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { hasLegacyData, hasAnonData, clearLegacyData } from "./storage-migration";
import { LEGACY_KEYS, STORAGE_KEYS } from "./storage-keys";

describe("storage-migration", () => {
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

  describe("hasLegacyData", () => {
    it("returns false when no legacy data exists", () => {
      expect(hasLegacyData()).toBe(false);
    });

    it("returns true when legacy district data exists", () => {
      mockStorage[LEGACY_KEYS.DISTRICT] = JSON.stringify({ state: "CA", district: "12" });
      expect(hasLegacyData()).toBe(true);
    });

    it("returns true when legacy sender info exists", () => {
      mockStorage[LEGACY_KEYS.SENDER_INFO] = JSON.stringify({ name: "John" });
      expect(hasLegacyData()).toBe(true);
    });

    it("returns true when legacy save pref exists", () => {
      mockStorage[LEGACY_KEYS.SAVE_SENDER_PREF] = "true";
      expect(hasLegacyData()).toBe(true);
    });
  });

  describe("hasAnonData", () => {
    it("returns false when no anon data exists", () => {
      expect(hasAnonData()).toBe(false);
    });

    it("returns true when anon district data exists", () => {
      mockStorage[`dd:anon:${STORAGE_KEYS.DISTRICT}`] = JSON.stringify({
        state: "CA",
        district: "12",
      });
      expect(hasAnonData()).toBe(true);
    });

    it("returns true when anon sender info exists", () => {
      mockStorage[`dd:anon:${STORAGE_KEYS.SENDER_INFO}`] = JSON.stringify({ name: "John" });
      expect(hasAnonData()).toBe(true);
    });
  });

  describe("clearLegacyData", () => {
    it("removes all legacy keys", () => {
      mockStorage[LEGACY_KEYS.DISTRICT] = JSON.stringify({ state: "CA", district: "12" });
      mockStorage[LEGACY_KEYS.SENDER_INFO] = JSON.stringify({ name: "John" });
      mockStorage[LEGACY_KEYS.SAVE_SENDER_PREF] = "true";

      clearLegacyData();

      expect(mockStorage[LEGACY_KEYS.DISTRICT]).toBeUndefined();
      expect(mockStorage[LEGACY_KEYS.SENDER_INFO]).toBeUndefined();
      expect(mockStorage[LEGACY_KEYS.SAVE_SENDER_PREF]).toBeUndefined();
    });

    it("does nothing when no legacy data exists", () => {
      clearLegacyData();
      expect(hasLegacyData()).toBe(false);
    });
  });
});
