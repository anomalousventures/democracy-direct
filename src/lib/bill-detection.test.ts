import { describe, it, expect } from "vitest";
import { detectBillNumbers } from "./bill-detection";

describe("detectBillNumbers", () => {
  it("detects standard H.R. format", () => {
    expect(detectBillNumbers("Please support H.R.1234")).toEqual(["H.R.1234"]);
  });

  it("detects standard S. format", () => {
    expect(detectBillNumbers("Vote yes on S.567")).toEqual(["S.567"]);
  });

  it("detects informal formats (HR1234, S567)", () => {
    expect(detectBillNumbers("HR1234 is important")).toEqual(["H.R.1234"]);
    expect(detectBillNumbers("S567 matters")).toEqual(["S.567"]);
  });

  it("detects formats with spaces (H.R. 1234)", () => {
    expect(detectBillNumbers("Support H.R. 1234 today")).toEqual(["H.R.1234"]);
  });

  it("detects joint resolutions", () => {
    expect(detectBillNumbers("H.J.Res.123 and S.J.Res.456")).toEqual([
      "H.J.Res.123",
      "S.J.Res.456",
    ]);
  });

  it("detects concurrent resolutions", () => {
    expect(detectBillNumbers("H.Con.Res.10 and S.Con.Res.20")).toEqual([
      "H.Con.Res.10",
      "S.Con.Res.20",
    ]);
  });

  it("detects simple resolutions", () => {
    expect(detectBillNumbers("H.Res.100 and S.Res.200")).toEqual(["H.Res.100", "S.Res.200"]);
  });

  it("detects mixed case", () => {
    expect(detectBillNumbers("support h.r.1234")).toEqual(["H.R.1234"]);
    expect(detectBillNumbers("vote on HR1234")).toEqual(["H.R.1234"]);
  });

  it("detects multiple bills in text", () => {
    const text = "We need to pass H.R.1 and S.2 to fix the issues raised by H.Res.300.";
    expect(detectBillNumbers(text)).toEqual(["H.R.1", "H.Res.300", "S.2"]);
  });

  it("deduplicates identical bills", () => {
    expect(detectBillNumbers("H.R.1234 is great. H.R.1234 should pass.")).toEqual(["H.R.1234"]);
  });

  it("deduplicates different formats of same bill", () => {
    expect(detectBillNumbers("HR1234 is the same as H.R.1234")).toEqual(["H.R.1234"]);
  });

  it("returns empty array for no matches", () => {
    expect(detectBillNumbers("This text has no bill references at all.")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(detectBillNumbers("")).toEqual([]);
  });

  it("handles bill numbers adjacent to punctuation", () => {
    expect(detectBillNumbers("(H.R.1234)")).toEqual(["H.R.1234"]);
    expect(detectBillNumbers("H.R.1234, S.567")).toEqual(["H.R.1234", "S.567"]);
  });

  it("handles bill numbers in HTML-like content", () => {
    expect(detectBillNumbers("<p>Support H.R.1234</p>")).toEqual(["H.R.1234"]);
  });

  it("returns sorted results", () => {
    const text = "S.999 and H.R.1 and H.Con.Res.5";
    const result = detectBillNumbers(text);
    expect(result).toEqual([...result].sort());
  });
});
