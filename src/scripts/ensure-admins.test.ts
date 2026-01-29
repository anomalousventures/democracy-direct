import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseAdminEmails } from "./ensure-admins";

describe("parseAdminEmails", () => {
  const originalWarn = console.warn;

  beforeEach(() => {
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  it("parses single valid email", () => {
    const result = parseAdminEmails("admin@example.com");
    expect(result).toEqual(["admin@example.com"]);
  });

  it("parses multiple comma-separated emails", () => {
    const result = parseAdminEmails("admin1@example.com,admin2@example.com,admin3@test.org");
    expect(result).toEqual(["admin1@example.com", "admin2@example.com", "admin3@test.org"]);
  });

  it("handles whitespace around emails", () => {
    const result = parseAdminEmails("  admin1@example.com , admin2@example.com  ");
    expect(result).toEqual(["admin1@example.com", "admin2@example.com"]);
  });

  it("skips invalid emails and logs warning", () => {
    const result = parseAdminEmails("valid@example.com,not-an-email,another@test.com");
    expect(result).toEqual(["valid@example.com", "another@test.com"]);
    expect(console.warn).toHaveBeenCalledWith("  Skipping invalid email: not-an-email");
  });

  it("returns empty array for empty string", () => {
    const result = parseAdminEmails("");
    expect(result).toEqual([]);
  });

  it("returns empty array when all emails are invalid", () => {
    const result = parseAdminEmails("invalid,also-invalid,nope");
    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalledTimes(3);
  });

  it("handles emails with plus addressing", () => {
    const result = parseAdminEmails("admin+test@example.com");
    expect(result).toEqual(["admin+test@example.com"]);
  });

  it("handles emails with subdomains", () => {
    const result = parseAdminEmails("user@mail.example.co.uk");
    expect(result).toEqual(["user@mail.example.co.uk"]);
  });

  it("skips empty entries between commas", () => {
    const result = parseAdminEmails("admin1@example.com,,admin2@example.com,");
    expect(result).toEqual(["admin1@example.com", "admin2@example.com"]);
  });
});
