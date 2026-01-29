import { describe, it, expect } from "vitest";
import { hashEmail, sha256 } from "./hash-email";

describe("hashEmail", () => {
  it("returns consistent hash for same email", () => {
    const email = "test@example.com";
    const hash1 = hashEmail(email);
    const hash2 = hashEmail(email);
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different emails", () => {
    const hash1 = hashEmail("user1@example.com");
    const hash2 = hashEmail("user2@example.com");
    expect(hash1).not.toBe(hash2);
  });

  it("normalizes email to lowercase", () => {
    const hash1 = hashEmail("Test@Example.COM");
    const hash2 = hashEmail("test@example.com");
    expect(hash1).toBe(hash2);
  });

  it("trims whitespace from email", () => {
    const hash1 = hashEmail("  test@example.com  ");
    const hash2 = hashEmail("test@example.com");
    expect(hash1).toBe(hash2);
  });

  it("handles combined normalization (case + whitespace)", () => {
    const hash1 = hashEmail("  TEST@EXAMPLE.COM  ");
    const hash2 = hashEmail("test@example.com");
    expect(hash1).toBe(hash2);
  });

  it("returns SHA-256 hex digest (64 characters)", () => {
    const hash = hashEmail("test@example.com");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});

describe("sha256", () => {
  it("returns consistent hash for same input", () => {
    expect(sha256("test")).toBe(sha256("test"));
  });

  it("returns different hash for different inputs", () => {
    expect(sha256("test1")).not.toBe(sha256("test2"));
  });
});
