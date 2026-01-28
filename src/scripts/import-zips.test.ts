import { describe, it, expect } from "vitest";
import { parseCensusFile, calculateProportions } from "./import-zips";

const sampleCensusData = `OID_CD119_20|GEOID_CD119_20|NAMELSAD_CD119_20|AREALAND_CD119_20|AREAWATER_CD119_20|MTFCC_CD119_20|FUNCSTAT_CD119_20|OID_ZCTA5_20|GEOID_ZCTA5_20|NAMELSAD_ZCTA5_20|AREALAND_ZCTA5_20|AREAWATER_ZCTA5_20|MTFCC_ZCTA5_20|CLASSFP_ZCTA5_20|FUNCSTAT_ZCTA5_20|AREALAND_PART|AREAWATER_PART
123|0637|Congressional District 37|1000000|0|G5200|N|456|90210|ZCTA5 90210|1000000|0|G6350|B5|S|1000000|0
123|3612|Congressional District 12|500000|0|G5200|N|789|10001|ZCTA5 10001|500000|0|G6350|B5|S|300000|0
123|3610|Congressional District 10|500000|0|G5200|N|790|10001|ZCTA5 10001|500000|0|G6350|B5|S|200000|0
123|1198|Congressional District 98|250000|0|G5200|N|791|20500|ZCTA5 20500|250000|0|G6350|B5|S|250000|0
`;

describe("parseCensusFile", () => {
  it("correctly parses pipe-delimited Census format", () => {
    const records = parseCensusFile(sampleCensusData);

    expect(records.length).toBe(4);
    expect(records[0].zcta).toBe("90210");
    expect(records[0].stateFips).toBe("06");
    expect(records[0].district).toBe("37");
  });

  it("handles split ZIPs (multiple districts)", () => {
    const records = parseCensusFile(sampleCensusData);
    const zip10001Records = records.filter((r) => r.zcta === "10001");

    expect(zip10001Records).toHaveLength(2);
  });

  it("parses area values as numbers", () => {
    const records = parseCensusFile(sampleCensusData);

    expect(typeof records[0].arealandZcta).toBe("number");
    expect(typeof records[0].arealandPart).toBe("number");
    expect(records[0].arealandZcta).toBe(1000000);
  });

  it("extracts state FIPS from GEOID", () => {
    const records = parseCensusFile(sampleCensusData);

    const caRecord = records.find((r) => r.zcta === "90210");
    const nyRecord = records.find((r) => r.zcta === "10001");

    expect(caRecord?.stateFips).toBe("06");
    expect(nyRecord?.stateFips).toBe("36");
  });

  it("skips invalid records without ZCTA", () => {
    const dataWithInvalid = `OID_CD119_20|GEOID_CD119_20|NAMELSAD_CD119_20|AREALAND_CD119_20|AREAWATER_CD119_20|MTFCC_CD119_20|FUNCSTAT_CD119_20|OID_ZCTA5_20|GEOID_ZCTA5_20|NAMELSAD_ZCTA5_20|AREALAND_ZCTA5_20|AREAWATER_ZCTA5_20|MTFCC_ZCTA5_20|CLASSFP_ZCTA5_20|FUNCSTAT_ZCTA5_20|AREALAND_PART|AREAWATER_PART
123|0637|Congressional District 37|1000000|0|G5200|N|||ZCTA5|1000000|0|G6350|B5|S|1000000|0
123|0637|Congressional District 37|1000000|0|G5200|N|456|90210|ZCTA5 90210|1000000|0|G6350|B5|S|1000000|0
`;
    const records = parseCensusFile(dataWithInvalid);

    expect(records).toHaveLength(1);
    expect(records[0].zcta).toBe("90210");
  });
});

describe("calculateProportions", () => {
  it("calculates correct proportion for single-district ZIP", () => {
    const records = [
      {
        stateFips: "06",
        district: "37",
        zcta: "90210",
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
    const records = [
      {
        stateFips: "36",
        district: "12",
        zcta: "10001",
        arealandZcta: 500000,
        arealandPart: 300000,
      },
      {
        stateFips: "36",
        district: "10",
        zcta: "10001",
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
    const records = [
      {
        stateFips: "11",
        district: "98",
        zcta: "20500",
        arealandZcta: 250000,
        arealandPart: 250000,
      },
    ];

    const result = calculateProportions(records);

    expect(result).toHaveLength(1);
    expect(result[0].district).toBe("0");
  });

  it("converts state FIPS to abbreviation", () => {
    const records = [
      {
        stateFips: "06",
        district: "37",
        zcta: "90210",
        arealandZcta: 1000000,
        arealandPart: 1000000,
      },
    ];

    const result = calculateProportions(records);

    expect(result[0].state).toBe("CA");
  });

  it("returns sorted by ZIP then proportion descending", () => {
    const records = [
      {
        stateFips: "36",
        district: "10",
        zcta: "10001",
        arealandZcta: 500000,
        arealandPart: 100000,
      },
      {
        stateFips: "36",
        district: "12",
        zcta: "10001",
        arealandZcta: 500000,
        arealandPart: 400000,
      },
    ];

    const result = calculateProportions(records);
    const zip10001 = result.filter((r) => r.zip === "10001");

    expect(zip10001[0].proportion).toBeGreaterThan(zip10001[1].proportion);
  });

  it("skips records with unknown state FIPS", () => {
    const records = [
      {
        stateFips: "99",
        district: "01",
        zcta: "00000",
        arealandZcta: 1000,
        arealandPart: 1000,
      },
    ];

    const result = calculateProportions(records);

    expect(result).toHaveLength(0);
  });

  it("strips leading zeros from district numbers", () => {
    const records = [
      {
        stateFips: "06",
        district: "07",
        zcta: "90210",
        arealandZcta: 1000000,
        arealandPart: 1000000,
      },
    ];

    const result = calculateProportions(records);

    expect(result[0].district).toBe("7");
  });
});
