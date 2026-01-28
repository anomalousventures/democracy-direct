import { describe, it, expect } from "vitest";
import { generateOTP, hashOTP, verifyOTP } from "./otp";

describe("OTP Generation", () => {
  describe("generateOTP", () => {
    it("generates a 6-digit numeric OTP", () => {
      const { otp } = generateOTP();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("returns both plain OTP and hashed OTP", () => {
      const result = generateOTP();
      expect(result).toHaveProperty("otp");
      expect(result).toHaveProperty("otpHash");
      expect(typeof result.otp).toBe("string");
      expect(typeof result.otpHash).toBe("string");
    });

    it("returns SHA-256 hash format (64 hex characters)", () => {
      const { otpHash } = generateOTP();
      expect(otpHash).toHaveLength(64);
      expect(otpHash).toMatch(/^[a-f0-9]+$/);
    });

    it("generates different OTPs on multiple calls", () => {
      const otps = new Set<string>();
      for (let i = 0; i < 10; i++) {
        otps.add(generateOTP().otp);
      }
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  describe("hashOTP", () => {
    it("returns consistent hash for same OTP", () => {
      const otp = "123456";
      const hash1 = hashOTP(otp);
      const hash2 = hashOTP(otp);
      expect(hash1).toBe(hash2);
    });
  });

  describe("verifyOTP", () => {
    it("returns true for matching OTP and hash", () => {
      const { otp, otpHash } = generateOTP();
      expect(verifyOTP(otp, otpHash)).toBe(true);
    });

    it("returns false for non-matching OTP", () => {
      const { otpHash } = generateOTP();
      expect(verifyOTP("000000", otpHash)).toBe(false);
    });
  });
});
