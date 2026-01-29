import { describe, it, expect } from "vitest";
import { createOtpEmail } from "./otp";

describe("createOtpEmail", () => {
  const params = {
    to: "test@example.com",
    otp: "123456",
    expiresInMinutes: 10,
  };

  it("creates email with correct recipient", () => {
    const email = createOtpEmail(params);
    expect(email.to).toBe("test@example.com");
  });

  it("includes OTP in subject line for easy mobile access", () => {
    const email = createOtpEmail(params);
    expect(email.subject).toContain("123456");
    expect(email.subject).toBe("123456 is your Democracy Direct code");
  });

  it("includes OTP in text body", () => {
    const email = createOtpEmail(params);
    expect(email.text).toContain("123456");
  });

  it("includes OTP in HTML body as copyable span", () => {
    const email = createOtpEmail(params);
    expect(email.html).toContain(">123456</span>");
    expect(email.html).toContain('aria-label="Your verification code: 123456"');
    expect(email.html).toContain("user-select: all");
  });

  it("includes expiry time in text body", () => {
    const email = createOtpEmail(params);
    expect(email.text).toContain("10 minutes");
  });

  it("includes expiry time in HTML body", () => {
    const email = createOtpEmail(params);
    expect(email.html).toContain("10 minutes");
  });

  it("includes privacy notice in HTML footer", () => {
    const email = createOtpEmail(params);
    expect(email.html).toContain("never store your email");
  });

  it("uses default expiry if not provided", () => {
    const email = createOtpEmail({ to: "test@example.com", otp: "999999" });
    expect(email.text).toContain("10 minutes");
  });
});
