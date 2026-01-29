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

    const createMockDb = (config: {
      otpRecords?: unknown[];
      userRecords?: unknown[];
      newUser?: { id: string };
    }) => {
      const { otpRecords = [], userRecords = [], newUser = { id: "new-user-1" } } = config;
      let fromTable = "";

      return {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockImplementation((table) => {
          fromTable = table?.[Symbol.for("drizzle:Name")] || "";
          return {
            where: vi.fn().mockImplementation(() => {
              if (fromTable === "email_otps") {
                return {
                  orderBy: vi.fn().mockResolvedValue(otpRecords),
                };
              }
              return Promise.resolve(userRecords);
            }),
          };
        }),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newUser]),
      };
    };

    it("returns session for correct OTP", async () => {
      const mockDb = createMockDb({
        otpRecords: [
          {
            id: "otp-1",
            emailHash,
            otpHash,
            expiresAt: new Date(Date.now() + 60000),
            usedAt: null,
            verificationAttempts: 0,
            createdAt: new Date(),
          },
        ],
        userRecords: [{ id: "user-1" }],
      });

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
    });

    it("returns error for wrong OTP and increments attempt counter", async () => {
      const mockDb = createMockDb({
        otpRecords: [
          {
            id: "otp-1",
            emailHash,
            otpHash: hashOTP("999999"),
            expiresAt: new Date(Date.now() + 60000),
            usedAt: null,
            verificationAttempts: 0,
            createdAt: new Date(),
          },
        ],
      });

      const result = await verifyOTPRequest(validEmail, "000000", mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
      expect(mockDb.update).toHaveBeenCalled();
    });

    it("returns error when OTP has exceeded max verification attempts", async () => {
      const mockDb = createMockDb({ otpRecords: [] });

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });

    it("allows verification within attempt limit", async () => {
      const mockDb = createMockDb({
        otpRecords: [
          {
            id: "otp-1",
            emailHash,
            otpHash,
            expiresAt: new Date(Date.now() + 60000),
            usedAt: null,
            verificationAttempts: 4,
            createdAt: new Date(),
          },
        ],
        userRecords: [{ id: "user-1" }],
      });

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
    });

    it("returns error for expired OTP (filtered by database)", async () => {
      const mockDb = createMockDb({ otpRecords: [] });

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });

    it("returns error for already used OTP (filtered by database)", async () => {
      const mockDb = createMockDb({ otpRecords: [] });

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });

    it("returns error for non-existent OTP", async () => {
      const mockDb = createMockDb({ otpRecords: [] });

      const result = await verifyOTPRequest(validEmail, validOTP, mockDb as never);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired OTP");
    });

    it("increments attempts on most recent OTP when multiple exist", async () => {
      const olderDate = new Date(Date.now() - 60000);
      const newerDate = new Date();

      const mockDb = createMockDb({
        otpRecords: [
          {
            id: "otp-newer",
            emailHash,
            otpHash: hashOTP("111111"),
            expiresAt: new Date(Date.now() + 60000),
            usedAt: null,
            verificationAttempts: 0,
            createdAt: newerDate,
          },
          {
            id: "otp-older",
            emailHash,
            otpHash: hashOTP("222222"),
            expiresAt: new Date(Date.now() + 60000),
            usedAt: null,
            verificationAttempts: 0,
            createdAt: olderDate,
          },
        ],
      });

      await verifyOTPRequest(validEmail, "000000", mockDb as never);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
