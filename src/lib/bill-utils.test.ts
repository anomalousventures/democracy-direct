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
  it.each([
    ["HR1234", "H.R.1234"],
    ["H.R. 1234", "H.R.1234"],
    ["h. r. 1234", "H.R.1234"],
    ["S567", "S.567"],
    ["s. 567", "S.567"],
    ["HJRes123", "H.J.Res.123"],
    ["h. j. res. 123", "H.J.Res.123"],
    ["SJRes45", "S.J.Res.45"],
    ["HConRes78", "H.Con.Res.78"],
    ["SConRes12", "S.Con.Res.12"],
    ["HRes99", "H.Res.99"],
    ["SRes33", "S.Res.33"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each(["", "invalid", "H.R.", "1234", "XYZ123"])(
    "returns null for invalid input: %s",
    (input) => {
      expect(normalizeBillNumber(input)).toBeNull();
    }
  );

  it("handles surrounding whitespace", () => {
    expect(normalizeBillNumber("  HR1234  ")).toBe("H.R.1234");
  });
});

describe("parseBillNumber", () => {
  it.each([
    ["H.R.1234", { type: "hr", number: 1234 }],
    ["hr1234", { type: "hr", number: 1234 }],
    ["S.567", { type: "s", number: 567 }],
    ["H.J.Res.123", { type: "hjres", number: 123 }],
    ["S.J.Res.45", { type: "sjres", number: 45 }],
    ["H.Con.Res.78", { type: "hconres", number: 78 }],
    ["S.Con.Res.12", { type: "sconres", number: 12 }],
    ["H.Res.99", { type: "hres", number: 99 }],
    ["S.Res.33", { type: "sres", number: 33 }],
  ])("parses %s correctly", (input, expected) => {
    expect(parseBillNumber(input)).toEqual(expected);
  });

  it.each(["", "invalid", "H.R."])("returns null for invalid input: %s", (input) => {
    expect(parseBillNumber(input)).toBeNull();
  });
});

describe("parseBillId", () => {
  it.each([
    ["hr1234", { type: "hr", number: 1234 }],
    ["s567", { type: "s", number: 567 }],
    ["hjres123", { type: "hjres", number: 123 }],
    ["SJRES45", { type: "sjres", number: 45 }],
  ])("parses URL-friendly bill ID %s", (input, expected) => {
    expect(parseBillId(input)).toEqual(expected);
  });

  it.each([
    ["hr1234-119", { type: "hr", number: 1234, congress: 119 }],
    ["s567-118", { type: "s", number: 567, congress: 118 }],
  ])("handles congress suffix in %s", (input, expected) => {
    expect(parseBillId(input)).toEqual(expected);
  });

  it.each(["", "invalid", "xyz123", "hr"])("returns null for invalid input: %s", (input) => {
    expect(parseBillId(input)).toBeNull();
  });
});

describe("toBillId", () => {
  it.each([
    [{ type: "hr", number: 1234 }, "hr1234"],
    [{ type: "s", number: 567 }, "s567"],
    [{ type: "hr", number: 1234, congress: 119 }, "hr1234-119"],
  ] as const)("converts %j to %s", (input, expected) => {
    expect(toBillId(input)).toBe(expected);
  });
});

describe("isValidBillType", () => {
  it.each(["hr", "s", "hjres", "sjres", "hconres", "sconres", "hres", "sres"])(
    "returns true for valid bill type: %s",
    (type) => {
      expect(isValidBillType(type)).toBe(true);
    }
  );

  it.each(["invalid", "", "xyz"])("returns false for invalid bill type: %s", (type) => {
    expect(isValidBillType(type)).toBe(false);
  });
});

describe("BILL_TYPE_DISPLAY_NAMES", () => {
  it("maps all bill types to display names", () => {
    expect(BILL_TYPE_DISPLAY_NAMES.hr).toBe("H.R.");
    expect(BILL_TYPE_DISPLAY_NAMES.s).toBe("S.");
    expect(BILL_TYPE_DISPLAY_NAMES.hjres).toBe("H.J.Res.");
    expect(BILL_TYPE_DISPLAY_NAMES.sconres).toBe("S.Con.Res.");
  });
});

describe("billIdToDisplay", () => {
  it.each([
    ["hr1234", "H.R.1234"],
    ["s567", "S.567"],
    ["hjres123", "H.J.Res.123"],
  ])("converts %s to %s", (input, expected) => {
    expect(billIdToDisplay(input)).toBe(expected);
  });

  it("returns null for invalid input", () => {
    expect(billIdToDisplay("invalid")).toBeNull();
  });
});

describe("getBillChamber", () => {
  it.each([
    ["hr", "house"],
    ["hjres", "house"],
    ["s", "senate"],
    ["sjres", "senate"],
  ] as const)("returns %s for %s", (type, expected) => {
    expect(getBillChamber(type)).toBe(expected);
  });
});

describe("buildCongressGovUrl", () => {
  it.each([
    [119, "hr", 1234, "https://www.congress.gov/bill/119th-congress/house-bill/1234"],
    [119, "s", 567, "https://www.congress.gov/bill/119th-congress/senate-bill/567"],
    [119, "hjres", 123, "https://www.congress.gov/bill/119th-congress/house-joint-resolution/123"],
    [
      118,
      "sconres",
      12,
      "https://www.congress.gov/bill/118th-congress/senate-concurrent-resolution/12",
    ],
  ] as const)("builds URL for congress %i, %s, %i", (congress, type, number, expected) => {
    expect(buildCongressGovUrl(congress, type, number)).toBe(expected);
  });
});
