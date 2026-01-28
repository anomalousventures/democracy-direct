import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyOTPRequest } from "@/pages/api/auth/verify-otp";
import { hashEmail } from "@/lib/auth/hash-email";
import { hashOTP } from "@/lib/auth/otp";

describe("OTP Verification Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyOTPRequest", () => {
    const validEmail = "test@example.com";
    const validOTP = "123456";
    const emailHash = hashEmail(validEmail);
    const otpHash = hashOTP(validOTP);

    it("returns session for correct OTP", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: "otp-1",
            emailHash,
            otpHash,
            expiresAt: new Date(Date.now() + 60000),
            usedAt: null,
          },
        ]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: "session-1" }]),
      };

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
    });

    it("returns error for wrong OTP", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: "otp-1",
            emailHash,
            otpHash,
            expiresAt: new Date(Date.now() + 60000),
            usedAt: null,
          },
        ]),
      };

      const result = await verifyOTPRequest(validEmail, "000000", mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });

    it("returns error for expired OTP (filtered by database)", async () => {
      // Database filters out expired OTPs, so empty result
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]), // no valid OTPs
      };

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });

    it("returns error for already used OTP (filtered by database)", async () => {
      // Database filters out used OTPs, so empty result
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]), // no valid OTPs
      };

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });

    it("returns error for non-existent OTP", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });
  });
});
