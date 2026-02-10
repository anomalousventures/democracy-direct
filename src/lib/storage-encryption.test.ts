import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { encrypt, decrypt, isEncryptedPayload } from "./storage-encryption";

describe("storage-encryption", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "crypto",
      globalThis.crypto ?? {
        subtle: {
          importKey: vi.fn(),
          deriveKey: vi.fn(),
          encrypt: vi.fn(),
          decrypt: vi.fn(),
        },
        getRandomValues: vi.fn((arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }),
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("encrypt and decrypt roundtrip", () => {
    it("encrypts and decrypts data correctly", async () => {
      const testData = JSON.stringify({ state: "CA", district: "12" });
      const emailHash = "abc123def456";

      const encrypted = await encrypt(testData, emailHash);
      expect(encrypted).not.toBe(testData);

      const decrypted = await decrypt(encrypted, emailHash);
      expect(decrypted).toBe(testData);
    });

    it("produces different ciphertext for same data with different keys", async () => {
      const testData = "test data";
      const hash1 = "hash1";
      const hash2 = "hash2";

      const encrypted1 = await encrypt(testData, hash1);
      const encrypted2 = await encrypt(testData, hash2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("handles complex JSON data", async () => {
      const testData = JSON.stringify({
        name: "John Doe",
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zip: "62701",
      });
      const emailHash = "test-email-hash";

      const encrypted = await encrypt(testData, emailHash);
      const decrypted = await decrypt(encrypted, emailHash);

      expect(decrypted).toBe(testData);
    });
  });

  describe("isEncryptedPayload", () => {
    it("returns true for valid encrypted payloads", () => {
      const validPayload = JSON.stringify({ iv: "abc123", ct: "def456" });
      expect(isEncryptedPayload(validPayload)).toBe(true);
    });

    it("returns false for non-JSON strings", () => {
      expect(isEncryptedPayload("not json")).toBe(false);
    });

    it("returns false for JSON without iv", () => {
      expect(isEncryptedPayload(JSON.stringify({ ct: "def456" }))).toBe(false);
    });

    it("returns false for JSON without ct", () => {
      expect(isEncryptedPayload(JSON.stringify({ iv: "abc123" }))).toBe(false);
    });

    it("returns false for JSON with non-string iv", () => {
      expect(isEncryptedPayload(JSON.stringify({ iv: 123, ct: "def456" }))).toBe(false);
    });

    it("returns false for JSON with non-string ct", () => {
      expect(isEncryptedPayload(JSON.stringify({ iv: "abc123", ct: 456 }))).toBe(false);
    });

    it("returns false for plain JSON data", () => {
      expect(isEncryptedPayload(JSON.stringify({ state: "CA", district: "12" }))).toBe(false);
    });
  });
});
