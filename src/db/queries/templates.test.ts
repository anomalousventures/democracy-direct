import { describe, it, expect } from "vitest";
import * as templatesModule from "./templates";
import { encodeCursor, decodeCursor } from "./templates";

describe("templates query module", () => {
  it("exports expected query functions", () => {
    const expectedExports = [
      "searchTemplatesWithCursor",
      "getApprovedTagNames",
      "linkTemplateTags",
      "unlinkAllTemplateTags",
      "syncTemplateTags",
      "encodeCursor",
      "decodeCursor",
    ];

    for (const name of expectedExports) {
      expect(templatesModule).toHaveProperty(name);
      expect(typeof templatesModule[name as keyof typeof templatesModule]).toBe("function");
    }
  });
});

describe("cursor encoding/decoding", () => {
  it("encodes and decodes a cursor correctly", () => {
    const score = 42;
    const createdAt = new Date("2025-01-15T10:30:00.000Z");
    const id = "550e8400-e29b-41d4-a716-446655440000";

    const encoded = encodeCursor(score, createdAt, id);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeCursor(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.score).toBe(score);
    expect(decoded?.createdAt.toISOString()).toBe(createdAt.toISOString());
    expect(decoded?.id).toBe(id);
  });

  it("returns null for invalid cursor string", () => {
    expect(decodeCursor("not-valid-base64!@#")).toBeNull();
  });

  it("returns null for malformed cursor data", () => {
    const malformedCursor = Buffer.from("invalid:data").toString("base64url");
    expect(decodeCursor(malformedCursor)).toBeNull();
  });

  it("returns null for cursor with invalid score", () => {
    const badScoreCursor = Buffer.from("notanumber:2025-01-15T10:30:00.000Z:some-id").toString(
      "base64url"
    );
    expect(decodeCursor(badScoreCursor)).toBeNull();
  });

  it("returns null for cursor with invalid date", () => {
    const badDateCursor = Buffer.from("42:not-a-date:some-id").toString("base64url");
    expect(decodeCursor(badDateCursor)).toBeNull();
  });

  it("returns null for cursor with missing id", () => {
    const missingIdCursor = Buffer.from("42:2025-01-15T10:30:00.000Z:").toString("base64url");
    expect(decodeCursor(missingIdCursor)).toBeNull();
  });

  it("handles zero score", () => {
    const score = 0;
    const createdAt = new Date("2025-01-15T10:30:00.000Z");
    const id = "test-id";

    const encoded = encodeCursor(score, createdAt, id);
    const decoded = decodeCursor(encoded);

    expect(decoded?.score).toBe(0);
  });

  it("handles negative score (edge case)", () => {
    const score = -5;
    const createdAt = new Date("2025-01-15T10:30:00.000Z");
    const id = "test-id";

    const encoded = encodeCursor(score, createdAt, id);
    const decoded = decodeCursor(encoded);

    expect(decoded?.score).toBe(-5);
  });

  it("handles very large scores", () => {
    const score = 999999999;
    const createdAt = new Date("2025-01-15T10:30:00.000Z");
    const id = "test-id";

    const encoded = encodeCursor(score, createdAt, id);
    const decoded = decodeCursor(encoded);

    expect(decoded?.score).toBe(score);
  });

  it("is URL-safe (base64url encoding)", () => {
    const score = 100;
    const createdAt = new Date("2025-01-15T10:30:00.000Z");
    const id = "550e8400-e29b-41d4-a716-446655440000";

    const encoded = encodeCursor(score, createdAt, id);
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
