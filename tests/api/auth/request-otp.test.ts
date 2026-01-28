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

import { requestOTP, validateEmail } from "@/pages/api/auth/request-otp";

describe("OTP Request Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateEmail", () => {
    it("accepts valid email format", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.org")).toBe(true);
      expect(validateEmail("user+tag@example.com")).toBe(true);
    });

    it("rejects invalid email format", () => {
      expect(validateEmail("notanemail")).toBe(false);
      expect(validateEmail("@nodomain.com")).toBe(false);
      expect(validateEmail("missing@")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });

  describe("requestOTP", () => {
    it("returns success for valid email", async () => {
      const result = await requestOTP("test@example.com");
      expect(result.success).toBe(true);
    });

    it("returns error for invalid email format", async () => {
      const result = await requestOTP("invalid-email");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email format");
    });

    it("returns generic success even for non-existent email (no info leakage)", async () => {
      const result = await requestOTP("nonexistent@example.com");
      expect(result.success).toBe(true);
    });
  });
});
