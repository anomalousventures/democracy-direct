import { describe, it, expect } from "vitest";
import {
  parseAmendmentNumber,
  parseAmendmentFromUrl,
  detectAmendmentFromVote,
  buildAmendmentCongressGovUrl,
  getAmendmentPageUrl,
  parseAmendmentId,
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

describe("parseAmendmentFromUrl", () => {
  it("parses House amendment URL", () => {
    const result = parseAmendmentFromUrl(
      "https://www.congress.gov/amendment/119/house-amendment/156"
    );
    expect(result).toEqual({ type: "hamdt", number: 156 });
  });

  it("parses Senate amendment URL", () => {
    const result = parseAmendmentFromUrl(
      "https://www.congress.gov/amendment/119/senate-amendment/4272"
    );
    expect(result).toEqual({ type: "samdt", number: 4272 });
  });

  it("handles URL with query parameters", () => {
    const result = parseAmendmentFromUrl(
      "https://www.congress.gov/amendment/119/house-amendment/123?overview=closed"
    );
    expect(result).toEqual({ type: "hamdt", number: 123 });
  });

  it("returns null for non-amendment URLs", () => {
    expect(parseAmendmentFromUrl("https://www.congress.gov/bill/119/hr/1234")).toBeNull();
    expect(parseAmendmentFromUrl("https://example.com")).toBeNull();
    expect(parseAmendmentFromUrl("")).toBeNull();
  });

  it("handles case insensitivity", () => {
    const result = parseAmendmentFromUrl(
      "https://www.congress.gov/amendment/119/HOUSE-AMENDMENT/789"
    );
    expect(result).toEqual({ type: "hamdt", number: 789 });
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

  it("detects amendment from legislationUrl first", () => {
    const result = detectAmendmentFromVote(
      "On Agreeing to the Amendment",
      "H.R.7148",
      "HR",
      "https://www.congress.gov/amendment/119/house-amendment/156"
    );
    expect(result).toEqual({ type: "hamdt", number: 156 });
  });

  it("falls back to billNumber when legislationUrl has no amendment", () => {
    const result = detectAmendmentFromVote(
      "On the Amendment",
      "S.AMDT.123",
      null,
      "https://www.congress.gov/bill/119/hr/1234"
    );
    expect(result).toEqual({ type: "samdt", number: 123 });
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

describe("getAmendmentPageUrl", () => {
  it("builds House amendment page URL", () => {
    const url = getAmendmentPageUrl("hamdt", "123", 119);
    expect(url).toBe("/legislation/amendment/hamdt123-119");
  });

  it("builds Senate amendment page URL", () => {
    const url = getAmendmentPageUrl("samdt", "456", 118);
    expect(url).toBe("/legislation/amendment/samdt456-118");
  });
});

describe("parseAmendmentId", () => {
  it("parses House amendment ID", () => {
    const result = parseAmendmentId("hamdt123-119");
    expect(result).toEqual({ type: "hamdt", number: "123", congress: 119 });
  });

  it("parses Senate amendment ID", () => {
    const result = parseAmendmentId("samdt456-118");
    expect(result).toEqual({ type: "samdt", number: "456", congress: 118 });
  });

  it("handles case insensitivity", () => {
    const result = parseAmendmentId("HAMDT789-119");
    expect(result).toEqual({ type: "hamdt", number: "789", congress: 119 });
  });

  it("returns null for invalid format", () => {
    expect(parseAmendmentId("invalid")).toBeNull();
    expect(parseAmendmentId("hr1234-119")).toBeNull();
    expect(parseAmendmentId("hamdt-119")).toBeNull();
    expect(parseAmendmentId("hamdt123")).toBeNull();
  });

  it("returns null for invalid congress number", () => {
    expect(parseAmendmentId("hamdt123-0")).toBeNull();
    expect(parseAmendmentId("hamdt123-abc")).toBeNull();
  });

  it("round-trips with getAmendmentPageUrl", () => {
    const url = getAmendmentPageUrl("samdt", "4272", 119);
    const id = url.split("/").pop()!;
    const parsed = parseAmendmentId(id);
    expect(parsed).toEqual({ type: "samdt", number: "4272", congress: 119 });
  });
});
