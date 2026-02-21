import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queryDistrictAtPoint, FIPS_TO_STATE, fipsToState } from "./tigerweb";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("queryDistrictAtPoint", () => {
  const mockGeoJsonResponse = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          STATE: "06",
          CD119: "12",
          NAME: "Congressional District 12",
          GEOID: "0612",
        },
        geometry: { type: "Polygon", coordinates: [] },
      },
    ],
  };

  it("returns DistrictInfo for a successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeoJsonResponse,
    });

    const result = await queryDistrictAtPoint(-122.4, 37.8);

    expect(result).toEqual({
      state: "06",
      district: "12",
      name: "Congressional District 12",
      geoid: "0612",
    });
  });

  it("returns null when no features are returned", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: "FeatureCollection", features: [] }),
    });

    const result = await queryDistrictAtPoint(-170.0, 0.0);
    expect(result).toBeNull();
  });

  it("returns null on fetch error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await queryDistrictAtPoint(-122.4, 37.8);
    expect(result).toBeNull();
  });

  it("returns null on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Server Error" });

    const result = await queryDistrictAtPoint(-122.4, 37.8);
    expect(result).toBeNull();
  });

  it("returns null when API returns error in body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: { code: 400, message: "Failed to execute query.", details: [] },
      }),
    });

    const result = await queryDistrictAtPoint(-122.4, 37.8);
    expect(result).toBeNull();
  });

  it("constructs the URL with correct coordinates and params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeoJsonResponse,
    });

    await queryDistrictAtPoint(-122.4, 37.8);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("geometry=-122.4%2C37.8");
    expect(calledUrl).toContain("geometryType=esriGeometryPoint");
    expect(calledUrl).toContain("spatialRel=esriSpatialRelIntersects");
    expect(calledUrl).toContain("outFields=STATE%2CCD119%2CNAME%2CGEOID");
    expect(calledUrl).toContain("f=geojson");
  });

  it("normalizes CD119=98 (non-voting delegate) to district 0", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              STATE: "11",
              CD119: "98",
              NAME: "Delegate District (at Large)",
              GEOID: "1198",
            },
            geometry: { type: "Polygon", coordinates: [] },
          },
        ],
      }),
    });

    const result = await queryDistrictAtPoint(-77.04, 38.9);

    expect(result).toEqual({
      state: "11",
      district: "0",
      name: "Delegate District (at Large)",
      geoid: "1198",
    });
  });

  it("handles at-large district (CD119 = 00)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              STATE: "50",
              CD119: "00",
              NAME: "Congressional District (at Large)",
              GEOID: "5000",
            },
            geometry: { type: "Polygon", coordinates: [] },
          },
        ],
      }),
    });

    const result = await queryDistrictAtPoint(-72.57, 44.26);

    expect(result).toEqual({
      state: "50",
      district: "0",
      name: "Congressional District (at Large)",
      geoid: "5000",
    });
  });
});

describe("FIPS_TO_STATE", () => {
  it("covers all 50 states + DC", () => {
    const stateAbbrevs = new Set(Object.values(FIPS_TO_STATE));
    const expectedStates = [
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
      "DC",
    ];

    for (const state of expectedStates) {
      expect(stateAbbrevs).toContain(state);
    }
  });

  it("includes territories (PR, GU, VI, AS, MP)", () => {
    const stateAbbrevs = new Set(Object.values(FIPS_TO_STATE));
    for (const territory of ["PR", "GU", "VI", "AS", "MP"]) {
      expect(stateAbbrevs).toContain(territory);
    }
  });

  it("has correct mappings for known FIPS codes", () => {
    expect(FIPS_TO_STATE["06"]).toBe("CA");
    expect(FIPS_TO_STATE["36"]).toBe("NY");
    expect(FIPS_TO_STATE["48"]).toBe("TX");
    expect(FIPS_TO_STATE["11"]).toBe("DC");
    expect(FIPS_TO_STATE["72"]).toBe("PR");
  });
});

describe("fipsToState", () => {
  it("returns correct state abbreviation for known FIPS codes", () => {
    expect(fipsToState("06")).toBe("CA");
    expect(fipsToState("36")).toBe("NY");
    expect(fipsToState("11")).toBe("DC");
  });

  it("returns undefined for unknown FIPS code", () => {
    expect(fipsToState("99")).toBeUndefined();
    expect(fipsToState("")).toBeUndefined();
    expect(fipsToState("ZZ")).toBeUndefined();
  });
});
