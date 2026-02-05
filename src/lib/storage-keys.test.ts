import { describe, it, expect } from "vitest";
import { STORAGE_KEYS, LEGACY_KEYS } from "./storage-keys";

describe("storage-keys", () => {
  describe("STORAGE_KEYS", () => {
    it("has all required keys", () => {
      expect(STORAGE_KEYS.DISTRICT).toBe("district");
      expect(STORAGE_KEYS.SENDER_INFO).toBe("sender-info");
      expect(STORAGE_KEYS.SAVE_SENDER_PREF).toBe("save-sender-pref");
    });
  });

  describe("LEGACY_KEYS", () => {
    it("has all required legacy keys", () => {
      expect(LEGACY_KEYS.DISTRICT).toBe("democracy-direct-district");
      expect(LEGACY_KEYS.SENDER_INFO).toBe("democracy-direct-sender-info");
      expect(LEGACY_KEYS.SAVE_SENDER_PREF).toBe("democracy-direct-save-sender-info");
    });
  });
});
