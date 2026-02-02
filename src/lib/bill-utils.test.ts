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
    ["H.R.1234", "H.R.1234"],
    ["H.R. 1234", "H.R.1234"],
    ["hr1234", "H.R.1234"],
    ["h.r.1234", "H.R.1234"],
    ["H. R. 1234", "H.R.1234"],
  ])("normalizes H.R. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each([
    ["S567", "S.567"],
    ["S.567", "S.567"],
    ["S. 567", "S.567"],
    ["s567", "S.567"],
    ["s.567", "S.567"],
  ])("normalizes S. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each([
    ["HJRes123", "H.J.Res.123"],
    ["H.J.Res.123", "H.J.Res.123"],
    ["H.J.Res. 123", "H.J.Res.123"],
    ["hjres123", "H.J.Res.123"],
    ["H. J. Res. 123", "H.J.Res.123"],
  ])("normalizes H.J.Res. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each([
    ["SJRes45", "S.J.Res.45"],
    ["S.J.Res.45", "S.J.Res.45"],
    ["sjres45", "S.J.Res.45"],
  ])("normalizes S.J.Res. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each([
    ["HConRes78", "H.Con.Res.78"],
    ["H.Con.Res.78", "H.Con.Res.78"],
    ["hconres78", "H.Con.Res.78"],
  ])("normalizes H.Con.Res. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each([
    ["SConRes12", "S.Con.Res.12"],
    ["S.Con.Res.12", "S.Con.Res.12"],
    ["sconres12", "S.Con.Res.12"],
  ])("normalizes S.Con.Res. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each([
    ["HRes99", "H.Res.99"],
    ["H.Res.99", "H.Res.99"],
    ["hres99", "H.Res.99"],
  ])("normalizes H.Res. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each([
    ["SRes33", "S.Res.33"],
    ["S.Res.33", "S.Res.33"],
    ["sres33", "S.Res.33"],
  ])("normalizes S.Res. variant %s to %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });

  it.each(["", "invalid", "H.R.", "1234", "XYZ123"])(
    "returns null for invalid input: %s",
    (input) => {
      expect(normalizeBillNumber(input)).toBeNull();
    }
  );

  it.each([
    ["  HR1234  ", "H.R.1234"],
    ["\tS567\n", "S.567"],
  ])("handles whitespace in %s", (input, expected) => {
    expect(normalizeBillNumber(input)).toBe(expected);
  });
});

describe("parseBillNumber", () => {
  it.each([
    ["H.R.1234", { type: "hr", number: 1234 }],
    ["HR1234", { type: "hr", number: 1234 }],
    ["S.567", { type: "s", number: 567 }],
    ["S567", { type: "s", number: 567 }],
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

  it.each([
    ["hr1234", { type: "hr", number: 1234 }],
    ["HJRES99", { type: "hjres", number: 99 }],
  ])("is case-insensitive: %s", (input, expected) => {
    expect(parseBillNumber(input)).toEqual(expected);
  });
});

describe("parseBillId", () => {
  it.each([
    ["hr1234", { type: "hr", number: 1234 }],
    ["s567", { type: "s", number: 567 }],
    ["hjres123", { type: "hjres", number: 123 }],
    ["sjres45", { type: "sjres", number: 45 }],
    ["hconres78", { type: "hconres", number: 78 }],
    ["sconres12", { type: "sconres", number: 12 }],
    ["hres99", { type: "hres", number: 99 }],
    ["sres33", { type: "sres", number: 33 }],
  ])("parses URL-friendly bill ID %s", (input, expected) => {
    expect(parseBillId(input)).toEqual(expected);
  });

  it.each([
    ["HR1234", { type: "hr", number: 1234 }],
    ["HJRES123", { type: "hjres", number: 123 }],
  ])("is case-insensitive: %s", (input, expected) => {
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
    [{ type: "hjres", number: 123 }, "hjres123"],
    [{ type: "sconres", number: 12 }, "sconres12"],
  ] as const)("converts %j to %s", (input, expected) => {
    expect(toBillId(input)).toBe(expected);
  });

  it.each([
    [{ type: "hr", number: 1234, congress: 119 }, "hr1234-119"],
    [{ type: "s", number: 567, congress: 118 }, "s567-118"],
  ] as const)("includes congress when provided: %j to %s", (input, expected) => {
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
  it.each([
    ["hr", "H.R."],
    ["s", "S."],
    ["hjres", "H.J.Res."],
    ["sjres", "S.J.Res."],
    ["hconres", "H.Con.Res."],
    ["sconres", "S.Con.Res."],
    ["hres", "H.Res."],
    ["sres", "S.Res."],
  ] as const)("has display name for %s: %s", (type, display) => {
    expect(BILL_TYPE_DISPLAY_NAMES[type]).toBe(display);
  });
});

describe("billIdToDisplay", () => {
  it.each([
    ["hr1234", "H.R.1234"],
    ["s567", "S.567"],
    ["hjres123", "H.J.Res.123"],
    ["sconres12", "S.Con.Res.12"],
  ])("converts %s to %s", (input, expected) => {
    expect(billIdToDisplay(input)).toBe(expected);
  });

  it.each(["", "invalid"])("returns null for invalid input: %s", (input) => {
    expect(billIdToDisplay(input)).toBeNull();
  });
});

describe("getBillChamber", () => {
  it.each(["hr", "hjres", "hconres", "hres"] as const)("returns house for %s", (type) => {
    expect(getBillChamber(type)).toBe("house");
  });

  it.each(["s", "sjres", "sconres", "sres"] as const)("returns senate for %s", (type) => {
    expect(getBillChamber(type)).toBe("senate");
  });
});

describe("buildCongressGovUrl", () => {
  it.each([
    [119, "hr", 1234, "https://www.congress.gov/bill/119th-congress/house-bill/1234"],
    [119, "s", 567, "https://www.congress.gov/bill/119th-congress/senate-bill/567"],
    [119, "hjres", 123, "https://www.congress.gov/bill/119th-congress/house-joint-resolution/123"],
    [119, "sjres", 45, "https://www.congress.gov/bill/119th-congress/senate-joint-resolution/45"],
    [
      119,
      "hconres",
      78,
      "https://www.congress.gov/bill/119th-congress/house-concurrent-resolution/78",
    ],
    [
      119,
      "sconres",
      12,
      "https://www.congress.gov/bill/119th-congress/senate-concurrent-resolution/12",
    ],
    [119, "hres", 99, "https://www.congress.gov/bill/119th-congress/house-resolution/99"],
    [119, "sres", 33, "https://www.congress.gov/bill/119th-congress/senate-resolution/33"],
  ] as const)("builds URL for congress %i, %s, %i", (congress, type, number, expected) => {
    expect(buildCongressGovUrl(congress, type, number)).toBe(expected);
  });
});
