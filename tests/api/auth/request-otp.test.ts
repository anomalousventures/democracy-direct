import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database and email modules
vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("@/lib/auth/send-otp-email", () => ({
  sendOTPEmail: vi.fn().mockResolvedValue(true),
}));

import { requestOTP } from "@/pages/api/auth/request-otp";
import { requestOtpBodySchema } from "@/lib/request-body";

const mockLocals = {
  user: null,
  runtime: {
    env: {
      DATABASE_URL: "mock-url",
      EMAIL_PROVIDER: "smtp",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
    },
  },
} as unknown as App.Locals;

describe("OTP Request Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestOtpBodySchema", () => {
    it("accepts valid email format", () => {
      expect(requestOtpBodySchema.safeParse({ email: "test@example.com" }).success).toBe(true);
      expect(requestOtpBodySchema.safeParse({ email: "user.name@domain.org" }).success).toBe(true);
      expect(requestOtpBodySchema.safeParse({ email: "user+tag@example.com" }).success).toBe(true);
    });

    it("rejects invalid email format", () => {
      expect(requestOtpBodySchema.safeParse({ email: "notanemail" }).success).toBe(false);
      expect(requestOtpBodySchema.safeParse({ email: "@nodomain.com" }).success).toBe(false);
      expect(requestOtpBodySchema.safeParse({ email: "missing@" }).success).toBe(false);
      expect(requestOtpBodySchema.safeParse({ email: "" }).success).toBe(false);
    });
  });

  describe("requestOTP", () => {
    it("returns success for valid email", async () => {
      const result = await requestOTP("test@example.com", mockLocals);
      expect(result.success).toBe(true);
    });

    it("returns generic success even for non-existent email (no info leakage)", async () => {
      const result = await requestOTP("nonexistent@example.com", mockLocals);
      expect(result.success).toBe(true);
    });

    it("rate limits after 5 requests per email per hour", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi
          .fn()
          .mockResolvedValue([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }]),
      };

      const mockEmailSender = vi.fn().mockResolvedValue(true);
      const result = await requestOTP(
        "test@example.com",
        mockLocals,
        mockDb as never,
        mockEmailSender
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Too many requests. Please try again later.");
      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(mockEmailSender).not.toHaveBeenCalled();
    });

    it("allows requests when under rate limit", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: "1" }, { id: "2" }]),
      };

      const mockEmailSender = vi.fn().mockResolvedValue(true);
      const result = await requestOTP(
        "test@example.com",
        mockLocals,
        mockDb as never,
        mockEmailSender
      );

      expect(result.success).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
