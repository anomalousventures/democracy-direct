import { describe, it, expect } from "vitest";
import { transformToClientFormat, type ZipDistrictDb } from "./export-zips";

describe("transformToClientFormat", () => {
  it("groups districts by ZIP code", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "10001", state: "NY", district: "12", proportion: 0.6 },
      { zip: "10001", state: "NY", district: "10", proportion: 0.4 },
      { zip: "90210", state: "CA", district: "37", proportion: 1.0 },
    ];

    const result = transformToClientFormat(dbRecords);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result["10001"]).toBeDefined();
    expect(result["90210"]).toBeDefined();
  });

  it("creates correct structure for single-district ZIP", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "90210", state: "CA", district: "37", proportion: 1.0 },
    ];

    const result = transformToClientFormat(dbRecords);

    expect(result["90210"]).toEqual({
      s: "CA",
      d: [{ d: "37", p: 1.0 }],
    });
  });

  it("creates correct structure for multi-district ZIP", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "10001", state: "NY", district: "12", proportion: 0.6 },
      { zip: "10001", state: "NY", district: "10", proportion: 0.4 },
    ];

    const result = transformToClientFormat(dbRecords);

    expect(result["10001"]).toEqual({
      s: "NY",
      d: [
        { d: "12", p: 0.6 },
        { d: "10", p: 0.4 },
      ],
    });
  });

  it("rounds proportions to 4 decimal places", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "12345", state: "TX", district: "5", proportion: 0.333333333 },
    ];

    const result = transformToClientFormat(dbRecords);

    expect(result["12345"].d[0].p).toBe(0.3333);
  });

  it("sorts districts by proportion descending", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "10001", state: "NY", district: "10", proportion: 0.2 },
      { zip: "10001", state: "NY", district: "12", proportion: 0.5 },
      { zip: "10001", state: "NY", district: "11", proportion: 0.3 },
    ];

    const result = transformToClientFormat(dbRecords);

    expect(result["10001"].d[0].d).toBe("12");
    expect(result["10001"].d[1].d).toBe("11");
    expect(result["10001"].d[2].d).toBe("10");
  });

  it("includes centroid coordinates when provided", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "90210", state: "CA", district: "37", proportion: 1.0 },
    ];
    const centroids = new Map([["90210", { lat: 34.09, lng: -118.41 }]]);
    const result = transformToClientFormat(dbRecords, centroids);

    expect(result["90210"]).toEqual({
      s: "CA",
      d: [{ d: "37", p: 1.0 }],
      lat: 34.09,
      lng: -118.41,
    });
  });

  it("omits centroid fields when no centroid data available", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "99999", state: "AK", district: "0", proportion: 1.0 },
    ];
    const centroids = new Map<string, { lat: number; lng: number }>();
    const result = transformToClientFormat(dbRecords, centroids);

    expect(result["99999"].lat).toBeUndefined();
    expect(result["99999"].lng).toBeUndefined();
  });

  it("omits centroid fields when centroids param not provided", () => {
    const dbRecords: ZipDistrictDb[] = [
      { zip: "90210", state: "CA", district: "37", proportion: 1.0 },
    ];
    const result = transformToClientFormat(dbRecords);

    expect(result["90210"].lat).toBeUndefined();
    expect(result["90210"].lng).toBeUndefined();
  });
});
