import { describe, it, expect } from "vitest";
import { STATE_NAMES, getStateName } from "./states";

describe("STATE_NAMES", () => {
  it("includes all 50 US states", () => {
    const states = [
      "AL",
      "AK",
      "AZ",
      "AR",
      "CA",
      "CO",
      "CT",
      "DE",
      "FL",
      "GA",
      "HI",
      "ID",
      "IL",
      "IN",
      "IA",
      "KS",
      "KY",
      "LA",
      "ME",
      "MD",
      "MA",
      "MI",
      "MN",
      "MS",
      "MO",
      "MT",
      "NE",
      "NV",
      "NH",
      "NJ",
      "NM",
      "NY",
      "NC",
      "ND",
      "OH",
      "OK",
      "OR",
      "PA",
      "RI",
      "SC",
      "SD",
      "TN",
      "TX",
      "UT",
      "VT",
      "VA",
      "WA",
      "WV",
      "WI",
      "WY",
    ];
    for (const abbrev of states) {
      expect(STATE_NAMES[abbrev]).toBeDefined();
    }
  });

  it("includes DC and territories", () => {
    expect(STATE_NAMES["DC"]).toBe("District of Columbia");
    expect(STATE_NAMES["PR"]).toBe("Puerto Rico");
    expect(STATE_NAMES["GU"]).toBe("Guam");
    expect(STATE_NAMES["VI"]).toBe("U.S. Virgin Islands");
    expect(STATE_NAMES["AS"]).toBe("American Samoa");
    expect(STATE_NAMES["MP"]).toBe("Northern Mariana Islands");
  });
});

describe("getStateName", () => {
  it("returns full state name for valid abbreviation", () => {
    expect(getStateName("CA")).toBe("California");
    expect(getStateName("NY")).toBe("New York");
    expect(getStateName("TX")).toBe("Texas");
  });

  it("returns full name for DC and territories", () => {
    expect(getStateName("DC")).toBe("District of Columbia");
    expect(getStateName("PR")).toBe("Puerto Rico");
  });

  it("returns input unchanged for unknown abbreviation", () => {
    expect(getStateName("XX")).toBe("XX");
    expect(getStateName("ZZ")).toBe("ZZ");
    expect(getStateName("")).toBe("");
  });
});
