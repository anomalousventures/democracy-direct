import { describe, it, expect } from "vitest";
import {
  normalizeBillNumber,
  parseBillNumber,
  parseBillId,
  toBillId,
  isValidBillType,
  billIdToDisplay,
  getBillChamber,
  buildCongressGovUrl,
  BILL_TYPE_DISPLAY_NAMES,
} from "./bill-utils";

describe("normalizeBillNumber", () => {
  it("normalizes H.R. variants", () => {
    expect(normalizeBillNumber("HR1234")).toBe("H.R.1234");
    expect(normalizeBillNumber("H.R.1234")).toBe("H.R.1234");
    expect(normalizeBillNumber("H.R. 1234")).toBe("H.R.1234");
    expect(normalizeBillNumber("hr1234")).toBe("H.R.1234");
    expect(normalizeBillNumber("h.r.1234")).toBe("H.R.1234");
    expect(normalizeBillNumber("H. R. 1234")).toBe("H.R.1234");
  });

  it("normalizes S. variants", () => {
    expect(normalizeBillNumber("S567")).toBe("S.567");
    expect(normalizeBillNumber("S.567")).toBe("S.567");
    expect(normalizeBillNumber("S. 567")).toBe("S.567");
    expect(normalizeBillNumber("s567")).toBe("S.567");
    expect(normalizeBillNumber("s.567")).toBe("S.567");
  });

  it("normalizes H.J.Res. variants", () => {
    expect(normalizeBillNumber("HJRes123")).toBe("H.J.Res.123");
    expect(normalizeBillNumber("H.J.Res.123")).toBe("H.J.Res.123");
    expect(normalizeBillNumber("H.J.Res. 123")).toBe("H.J.Res.123");
    expect(normalizeBillNumber("hjres123")).toBe("H.J.Res.123");
    expect(normalizeBillNumber("H. J. Res. 123")).toBe("H.J.Res.123");
  });

  it("normalizes S.J.Res. variants", () => {
    expect(normalizeBillNumber("SJRes45")).toBe("S.J.Res.45");
    expect(normalizeBillNumber("S.J.Res.45")).toBe("S.J.Res.45");
    expect(normalizeBillNumber("sjres45")).toBe("S.J.Res.45");
  });

  it("normalizes H.Con.Res. variants", () => {
    expect(normalizeBillNumber("HConRes78")).toBe("H.Con.Res.78");
    expect(normalizeBillNumber("H.Con.Res.78")).toBe("H.Con.Res.78");
    expect(normalizeBillNumber("hconres78")).toBe("H.Con.Res.78");
  });

  it("normalizes S.Con.Res. variants", () => {
    expect(normalizeBillNumber("SConRes12")).toBe("S.Con.Res.12");
    expect(normalizeBillNumber("S.Con.Res.12")).toBe("S.Con.Res.12");
    expect(normalizeBillNumber("sconres12")).toBe("S.Con.Res.12");
  });

  it("normalizes H.Res. variants", () => {
    expect(normalizeBillNumber("HRes99")).toBe("H.Res.99");
    expect(normalizeBillNumber("H.Res.99")).toBe("H.Res.99");
    expect(normalizeBillNumber("hres99")).toBe("H.Res.99");
  });

  it("normalizes S.Res. variants", () => {
    expect(normalizeBillNumber("SRes33")).toBe("S.Res.33");
    expect(normalizeBillNumber("S.Res.33")).toBe("S.Res.33");
    expect(normalizeBillNumber("sres33")).toBe("S.Res.33");
  });

  it("returns null for invalid bill numbers", () => {
    expect(normalizeBillNumber("")).toBeNull();
    expect(normalizeBillNumber("invalid")).toBeNull();
    expect(normalizeBillNumber("H.R.")).toBeNull();
    expect(normalizeBillNumber("1234")).toBeNull();
    expect(normalizeBillNumber("XYZ123")).toBeNull();
  });

  it("handles whitespace", () => {
    expect(normalizeBillNumber("  HR1234  ")).toBe("H.R.1234");
    expect(normalizeBillNumber("\tS567\n")).toBe("S.567");
  });
});

describe("parseBillNumber", () => {
  it("parses H.R. bills", () => {
    expect(parseBillNumber("H.R.1234")).toEqual({ type: "hr", number: 1234 });
    expect(parseBillNumber("HR1234")).toEqual({ type: "hr", number: 1234 });
  });

  it("parses S. bills", () => {
    expect(parseBillNumber("S.567")).toEqual({ type: "s", number: 567 });
    expect(parseBillNumber("S567")).toEqual({ type: "s", number: 567 });
  });

  it("parses joint resolutions", () => {
    expect(parseBillNumber("H.J.Res.123")).toEqual({
      type: "hjres",
      number: 123,
    });
    expect(parseBillNumber("S.J.Res.45")).toEqual({ type: "sjres", number: 45 });
  });

  it("parses concurrent resolutions", () => {
    expect(parseBillNumber("H.Con.Res.78")).toEqual({
      type: "hconres",
      number: 78,
    });
    expect(parseBillNumber("S.Con.Res.12")).toEqual({
      type: "sconres",
      number: 12,
    });
  });

  it("parses simple resolutions", () => {
    expect(parseBillNumber("H.Res.99")).toEqual({ type: "hres", number: 99 });
    expect(parseBillNumber("S.Res.33")).toEqual({ type: "sres", number: 33 });
  });

  it("returns null for invalid inputs", () => {
    expect(parseBillNumber("")).toBeNull();
    expect(parseBillNumber("invalid")).toBeNull();
    expect(parseBillNumber("H.R.")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(parseBillNumber("hr1234")).toEqual({ type: "hr", number: 1234 });
    expect(parseBillNumber("HJRES99")).toEqual({ type: "hjres", number: 99 });
  });
});

describe("parseBillId", () => {
  it("parses URL-friendly bill IDs", () => {
    expect(parseBillId("hr1234")).toEqual({ type: "hr", number: 1234 });
    expect(parseBillId("s567")).toEqual({ type: "s", number: 567 });
    expect(parseBillId("hjres123")).toEqual({ type: "hjres", number: 123 });
    expect(parseBillId("sjres45")).toEqual({ type: "sjres", number: 45 });
    expect(parseBillId("hconres78")).toEqual({ type: "hconres", number: 78 });
    expect(parseBillId("sconres12")).toEqual({ type: "sconres", number: 12 });
    expect(parseBillId("hres99")).toEqual({ type: "hres", number: 99 });
    expect(parseBillId("sres33")).toEqual({ type: "sres", number: 33 });
  });

  it("is case-insensitive", () => {
    expect(parseBillId("HR1234")).toEqual({ type: "hr", number: 1234 });
    expect(parseBillId("HJRES123")).toEqual({ type: "hjres", number: 123 });
  });

  it("handles congress suffix", () => {
    expect(parseBillId("hr1234-119")).toEqual({
      type: "hr",
      number: 1234,
      congress: 119,
    });
    expect(parseBillId("s567-118")).toEqual({
      type: "s",
      number: 567,
      congress: 118,
    });
  });

  it("returns null for invalid inputs", () => {
    expect(parseBillId("")).toBeNull();
    expect(parseBillId("invalid")).toBeNull();
    expect(parseBillId("xyz123")).toBeNull();
    expect(parseBillId("hr")).toBeNull();
  });
});

describe("toBillId", () => {
  it("converts parsed bill to URL-friendly ID", () => {
    expect(toBillId({ type: "hr", number: 1234 })).toBe("hr1234");
    expect(toBillId({ type: "s", number: 567 })).toBe("s567");
    expect(toBillId({ type: "hjres", number: 123 })).toBe("hjres123");
    expect(toBillId({ type: "sconres", number: 12 })).toBe("sconres12");
  });

  it("includes congress when provided", () => {
    expect(toBillId({ type: "hr", number: 1234, congress: 119 })).toBe("hr1234-119");
    expect(toBillId({ type: "s", number: 567, congress: 118 })).toBe("s567-118");
  });
});

describe("isValidBillType", () => {
  it("returns true for valid bill types", () => {
    expect(isValidBillType("hr")).toBe(true);
    expect(isValidBillType("s")).toBe(true);
    expect(isValidBillType("hjres")).toBe(true);
    expect(isValidBillType("sjres")).toBe(true);
    expect(isValidBillType("hconres")).toBe(true);
    expect(isValidBillType("sconres")).toBe(true);
    expect(isValidBillType("hres")).toBe(true);
    expect(isValidBillType("sres")).toBe(true);
  });

  it("returns false for invalid bill types", () => {
    expect(isValidBillType("invalid")).toBe(false);
    expect(isValidBillType("")).toBe(false);
    expect(isValidBillType("xyz")).toBe(false);
  });
});

describe("BILL_TYPE_DISPLAY_NAMES", () => {
  it("has display names for all bill types", () => {
    expect(BILL_TYPE_DISPLAY_NAMES.hr).toBe("H.R.");
    expect(BILL_TYPE_DISPLAY_NAMES.s).toBe("S.");
    expect(BILL_TYPE_DISPLAY_NAMES.hjres).toBe("H.J.Res.");
    expect(BILL_TYPE_DISPLAY_NAMES.sjres).toBe("S.J.Res.");
    expect(BILL_TYPE_DISPLAY_NAMES.hconres).toBe("H.Con.Res.");
    expect(BILL_TYPE_DISPLAY_NAMES.sconres).toBe("S.Con.Res.");
    expect(BILL_TYPE_DISPLAY_NAMES.hres).toBe("H.Res.");
    expect(BILL_TYPE_DISPLAY_NAMES.sres).toBe("S.Res.");
  });
});

describe("billIdToDisplay", () => {
  it("converts URL-friendly bill ID to display format", () => {
    expect(billIdToDisplay("hr1234")).toBe("H.R.1234");
    expect(billIdToDisplay("s567")).toBe("S.567");
    expect(billIdToDisplay("hjres123")).toBe("H.J.Res.123");
    expect(billIdToDisplay("sconres12")).toBe("S.Con.Res.12");
  });

  it("returns null for invalid inputs", () => {
    expect(billIdToDisplay("")).toBeNull();
    expect(billIdToDisplay("invalid")).toBeNull();
  });
});

describe("getBillChamber", () => {
  it("returns house for House bill types", () => {
    expect(getBillChamber("hr")).toBe("house");
    expect(getBillChamber("hjres")).toBe("house");
    expect(getBillChamber("hconres")).toBe("house");
    expect(getBillChamber("hres")).toBe("house");
  });

  it("returns senate for Senate bill types", () => {
    expect(getBillChamber("s")).toBe("senate");
    expect(getBillChamber("sjres")).toBe("senate");
    expect(getBillChamber("sconres")).toBe("senate");
    expect(getBillChamber("sres")).toBe("senate");
  });
});

describe("buildCongressGovUrl", () => {
  it("builds correct URLs for House bills", () => {
    expect(buildCongressGovUrl(119, "hr", 1234)).toBe(
      "https://www.congress.gov/bill/119th-congress/house-bill/1234"
    );
  });

  it("builds correct URLs for Senate bills", () => {
    expect(buildCongressGovUrl(119, "s", 567)).toBe(
      "https://www.congress.gov/bill/119th-congress/senate-bill/567"
    );
  });

  it("builds correct URLs for joint resolutions", () => {
    expect(buildCongressGovUrl(119, "hjres", 123)).toBe(
      "https://www.congress.gov/bill/119th-congress/house-joint-resolution/123"
    );
    expect(buildCongressGovUrl(119, "sjres", 45)).toBe(
      "https://www.congress.gov/bill/119th-congress/senate-joint-resolution/45"
    );
  });

  it("builds correct URLs for concurrent resolutions", () => {
    expect(buildCongressGovUrl(119, "hconres", 78)).toBe(
      "https://www.congress.gov/bill/119th-congress/house-concurrent-resolution/78"
    );
    expect(buildCongressGovUrl(119, "sconres", 12)).toBe(
      "https://www.congress.gov/bill/119th-congress/senate-concurrent-resolution/12"
    );
  });

  it("builds correct URLs for simple resolutions", () => {
    expect(buildCongressGovUrl(119, "hres", 99)).toBe(
      "https://www.congress.gov/bill/119th-congress/house-resolution/99"
    );
    expect(buildCongressGovUrl(119, "sres", 33)).toBe(
      "https://www.congress.gov/bill/119th-congress/senate-resolution/33"
    );
  });
});
