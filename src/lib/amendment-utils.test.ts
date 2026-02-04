import { describe, it, expect } from "vitest";
import {
  parseAmendmentNumber,
  detectAmendmentFromVote,
  buildAmendmentCongressGovUrl,
} from "./amendment-utils";

describe("parseAmendmentNumber", () => {
  it("parses House amendment format with periods", () => {
    const result = parseAmendmentNumber("H.AMDT.123");
    expect(result).toEqual({ type: "hamdt", number: 123 });
  });

  it("parses Senate amendment format with periods", () => {
    const result = parseAmendmentNumber("S.AMDT.456");
    expect(result).toEqual({ type: "samdt", number: 456 });
  });

  it("parses House amendment format without periods", () => {
    const result = parseAmendmentNumber("H AMDT 789");
    expect(result).toEqual({ type: "hamdt", number: 789 });
  });

  it("parses lowercase input", () => {
    const result = parseAmendmentNumber("h.amdt.100");
    expect(result).toEqual({ type: "hamdt", number: 100 });
  });

  it("returns null for non-amendment bill numbers", () => {
    expect(parseAmendmentNumber("H.R.1234")).toBeNull();
    expect(parseAmendmentNumber("S.5678")).toBeNull();
    expect(parseAmendmentNumber("random text")).toBeNull();
  });

  it("handles whitespace", () => {
    const result = parseAmendmentNumber("  H.AMDT.50  ");
    expect(result).toEqual({ type: "hamdt", number: 50 });
  });
});

describe("detectAmendmentFromVote", () => {
  it("detects amendment when legislationType is AMENDMENT", () => {
    const result = detectAmendmentFromVote("On the Amendment", "H.AMDT.123", "AMENDMENT");
    expect(result).toEqual({ type: "hamdt", number: 123 });
  });

  it("detects amendment from billNumber regardless of legislationType", () => {
    const result = detectAmendmentFromVote("On Passage", "S.AMDT.456", "BILL");
    expect(result).toEqual({ type: "samdt", number: 456 });
  });

  it("detects amendment from question text", () => {
    const result = detectAmendmentFromVote("On the Amendment H.AMDT.789", null, null);
    expect(result).toEqual({ type: "hamdt", number: 789 });
  });

  it("detects amendment with 'Amendment' keyword in question", () => {
    const result = detectAmendmentFromVote("Motion to Table Amendment S.AMDT.100", null, null);
    expect(result).toEqual({ type: "samdt", number: 100 });
  });

  it("returns null when no amendment detected", () => {
    const result = detectAmendmentFromVote("On Passage of the Bill", "H.R.1234", "BILL");
    expect(result).toBeNull();
  });

  it("returns null for null inputs", () => {
    const result = detectAmendmentFromVote("On Passage", null, null);
    expect(result).toBeNull();
  });
});

describe("buildAmendmentCongressGovUrl", () => {
  it("builds House amendment URL", () => {
    const url = buildAmendmentCongressGovUrl(119, "hamdt", 123);
    expect(url).toBe("https://www.congress.gov/amendment/119th-congress/house-amendment/123");
  });

  it("builds Senate amendment URL", () => {
    const url = buildAmendmentCongressGovUrl(118, "samdt", 456);
    expect(url).toBe("https://www.congress.gov/amendment/118th-congress/senate-amendment/456");
  });
});
