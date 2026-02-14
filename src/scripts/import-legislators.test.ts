import { describe, it, expect } from "vitest";
import { parseLegislatorYaml, transformLegislator, type RawLegislator } from "./import-legislators";

const sampleYaml = `
- id:
    bioguide: A000001
    thomas: "00001"
    govtrack: 400001
    opensecrets: N00000001
    votesmart: 1001
    fec:
      - H0AA00001
    wikipedia: John Doe (politician)
    ballotpedia: John Doe
  name:
    first: John
    middle: Q
    last: Doe
    official_full: John Q. Doe
  bio:
    birthday: "1960-01-15"
    gender: M
  terms:
    - type: sen
      start: "2019-01-03"
      end: "2025-01-03"
      state: CA
      class: 1
      state_rank: senior
      party: Democrat
      url: https://doe.senate.gov
      contact_form: https://doe.senate.gov/contact
      address: 123 Hart Senate Office Building Washington DC 20510
      phone: 202-555-0100
- id:
    bioguide: B000002
    govtrack: 400002
  name:
    first: Jane
    last: Smith
    official_full: Jane Smith
  bio:
    birthday: "1975-06-20"
    gender: F
  terms:
    - type: rep
      start: "2021-01-03"
      end: "2023-01-03"
      state: TX
      district: 10
      party: Republican
      url: https://smith.house.gov
      phone: 202-555-0200
`;

describe("parseLegislatorYaml", () => {
  it("correctly extracts fields from YAML", () => {
    const legislators = parseLegislatorYaml(sampleYaml);

    expect(legislators).toHaveLength(2);
    expect(legislators[0].id.bioguide).toBe("A000001");
    expect(legislators[0].name.first).toBe("John");
    expect(legislators[0].name.last).toBe("Doe");
    expect(legislators[0].bio.gender).toBe("M");
  });

  it("parses terms array correctly", () => {
    const legislators = parseLegislatorYaml(sampleYaml);

    expect(legislators[0].terms).toHaveLength(1);
    expect(legislators[0].terms[0].type).toBe("sen");
    expect(legislators[0].terms[0].state).toBe("CA");
    expect(legislators[0].terms[0].party).toBe("Democrat");
  });
});

describe("transformLegislator", () => {
  const rawSenator: RawLegislator = {
    id: {
      bioguide: "A000001",
      thomas: "00001",
      govtrack: 400001,
      opensecrets: "N00000001",
      votesmart: 1001,
      fec: ["H0AA00001"],
      wikipedia: "John Doe (politician)",
      ballotpedia: "John Doe",
    },
    name: {
      first: "John",
      middle: "Q",
      last: "Doe",
      official_full: "John Q. Doe",
    },
    bio: {
      birthday: "1960-01-15",
      gender: "M",
    },
    terms: [
      {
        type: "sen",
        start: "2019-01-03",
        end: "2025-01-03",
        state: "CA",
        class: 1,
        state_rank: "senior",
        party: "Democrat",
        url: "https://doe.senate.gov",
        contact_form: "https://doe.senate.gov/contact",
        address: "123 Hart Senate Office Building Washington DC 20510",
        phone: "202-555-0100",
      },
    ],
  };

  const rawRep: RawLegislator = {
    id: {
      bioguide: "B000002",
      govtrack: 400002,
    },
    name: {
      first: "Jane",
      last: "Smith",
      official_full: "Jane Smith",
    },
    bio: {
      birthday: "1975-06-20",
      gender: "F",
    },
    terms: [
      {
        type: "rep",
        start: "2021-01-03",
        end: "2023-01-03",
        state: "TX",
        district: 10,
        party: "Republican",
        url: "https://smith.house.gov",
        phone: "202-555-0200",
      },
    ],
  };

  it("transforms senator to database schema", () => {
    const result = transformLegislator(rawSenator);

    expect(result.bioguideId).toBe("A000001");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.fullName).toBe("John Q. Doe");
    expect(result.party).toBe("Democrat");
    expect(result.state).toBe("CA");
    expect(result.district).toBeNull();
    expect(result.chamber).toBe("senate");
    expect(result.title).toBe("Senior Senator");
    expect(result.phoneCapitol).toBe("202-555-0100");
    expect(result.contactFormUrl).toBe("https://doe.senate.gov/contact");
    expect(result.website).toBe("https://doe.senate.gov");
    expect(result.addressCapitol).toBe("123 Hart Senate Office Building Washington DC 20510");
    expect(result.termStart).toBe("2019-01-03");
    expect(result.termEnd).toBe("2025-01-03");
  });

  it("transforms representative to database schema", () => {
    const result = transformLegislator(rawRep);

    expect(result.bioguideId).toBe("B000002");
    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Smith");
    expect(result.fullName).toBe("Jane Smith");
    expect(result.party).toBe("Republican");
    expect(result.state).toBe("TX");
    expect(result.district).toBe("10");
    expect(result.chamber).toBe("house");
    expect(result.title).toBe("Representative");
  });

  it("handles missing optional fields", () => {
    const result = transformLegislator(rawRep);

    expect(result.contactFormUrl).toBeNull();
    expect(result.twitterHandle).toBeNull();
    expect(result.facebookId).toBeNull();
    expect(result.youtubeId).toBeNull();
    expect(result.fax).toBeNull();
  });

  it("uses current term (last in array)", () => {
    const multiTermLegislator: RawLegislator = {
      ...rawRep,
      terms: [
        {
          type: "rep",
          start: "2019-01-03",
          end: "2021-01-03",
          state: "TX",
          district: 10,
          party: "Republican",
        },
        {
          type: "rep",
          start: "2021-01-03",
          end: "2023-01-03",
          state: "TX",
          district: 15,
          party: "Republican",
        },
      ],
    };

    const result = transformLegislator(multiTermLegislator);
    expect(result.district).toBe("15");
  });

  it("extracts lisId from senator id object", () => {
    const senatorWithLisId: RawLegislator = {
      ...rawSenator,
      id: {
        ...rawSenator.id,
        lis: "S001",
      },
    };

    const result = transformLegislator(senatorWithLisId);
    expect(result.lisId).toBe("S001");
  });

  it("returns null for lisId when not present", () => {
    const result = transformLegislator(rawRep);
    expect(result.lisId).toBeNull();
  });

  it("extracts single FEC ID as array", () => {
    const result = transformLegislator(rawSenator);
    expect(result.fecIds).toEqual(["H0AA00001"]);
  });

  it("extracts multiple FEC IDs", () => {
    const legislatorWithMultipleFecIds: RawLegislator = {
      ...rawSenator,
      id: {
        ...rawSenator.id,
        fec: ["S4VT00033", "P60007168"],
      },
    };

    const result = transformLegislator(legislatorWithMultipleFecIds);
    expect(result.fecIds).toEqual(["S4VT00033", "P60007168"]);
  });

  it("returns null for fecIds when not present", () => {
    const result = transformLegislator(rawRep);
    expect(result.fecIds).toBeNull();
  });

  it("returns null for fecIds when array is empty", () => {
    const legislatorWithEmptyFec: RawLegislator = {
      ...rawSenator,
      id: {
        ...rawSenator.id,
        fec: [],
      },
    };

    const result = transformLegislator(legislatorWithEmptyFec);
    expect(result.fecIds).toBeNull();
  });
});
