import { describe, it, expect } from "vitest";
import { parseZctaCdCsv, calculateProportions, type ZctaCdRecord } from "./import-zips";

const sampleCsv = `ZCTA5,STATE,CD,AREALAND_ZCTA,AREALAND_PART
90210,CA,37,1000000,1000000
10001,NY,12,500000,300000
10001,NY,10,500000,200000
20500,DC,98,250000,250000
`;

describe("parseZctaCdCsv", () => {
  it("correctly parses CSV format", () => {
    const records = parseZctaCdCsv(sampleCsv);

    expect(records.length).toBeGreaterThan(0);
    expect(records[0].zcta5).toBe("90210");
    expect(records[0].state).toBe("CA");
    expect(records[0].cd).toBe("37");
  });

  it("handles split ZIPs (multiple districts)", () => {
    const records = parseZctaCdCsv(sampleCsv);
    const zip10001Records = records.filter((r) => r.zcta5 === "10001");

    expect(zip10001Records).toHaveLength(2);
  });

  it("parses area values as numbers", () => {
    const records = parseZctaCdCsv(sampleCsv);

    expect(typeof records[0].arealandZcta).toBe("number");
    expect(typeof records[0].arealandPart).toBe("number");
    expect(records[0].arealandZcta).toBe(1000000);
  });
});

describe("calculateProportions", () => {
  it("calculates correct proportion for single-district ZIP", () => {
    const records: ZctaCdRecord[] = [
      {
        zcta5: "90210",
        state: "CA",
        cd: "37",
        arealandZcta: 1000000,
        arealandPart: 1000000,
      },
    ];

    const result = calculateProportions(records);

    expect(result).toHaveLength(1);
    expect(result[0].zip).toBe("90210");
    expect(result[0].state).toBe("CA");
    expect(result[0].district).toBe("37");
    expect(result[0].proportion).toBeCloseTo(1.0);
  });

  it("calculates proportions correctly for split ZIPs", () => {
    const records: ZctaCdRecord[] = [
      {
        zcta5: "10001",
        state: "NY",
        cd: "12",
        arealandZcta: 500000,
        arealandPart: 300000,
      },
      {
        zcta5: "10001",
        state: "NY",
        cd: "10",
        arealandZcta: 500000,
        arealandPart: 200000,
      },
    ];

    const result = calculateProportions(records);

    expect(result).toHaveLength(2);

    const district12 = result.find((r) => r.district === "12");
    const district10 = result.find((r) => r.district === "10");

    expect(district12?.proportion).toBeCloseTo(0.6);
    expect(district10?.proportion).toBeCloseTo(0.4);
  });

  it("handles at-large districts (CD=98 or CD=00)", () => {
    const records: ZctaCdRecord[] = [
      {
        zcta5: "20500",
        state: "DC",
        cd: "98",
        arealandZcta: 250000,
        arealandPart: 250000,
      },
    ];

    const result = calculateProportions(records);

    expect(result).toHaveLength(1);
    expect(result[0].district).toBe("0");
  });

  it("returns sorted by proportion descending", () => {
    const records: ZctaCdRecord[] = [
      {
        zcta5: "10001",
        state: "NY",
        cd: "10",
        arealandZcta: 500000,
        arealandPart: 100000,
      },
      {
        zcta5: "10001",
        state: "NY",
        cd: "12",
        arealandZcta: 500000,
        arealandPart: 400000,
      },
    ];

    const result = calculateProportions(records);
    const zip10001 = result.filter((r) => r.zip === "10001");

    expect(zip10001[0].proportion).toBeGreaterThan(zip10001[1].proportion);
  });
});
