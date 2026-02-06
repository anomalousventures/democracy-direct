import { describe, it, expect } from "vitest";
import * as billsModule from "./bills";

describe("bills query module", () => {
  it("exports expected query functions", () => {
    const expectedExports = [
      "getBillById",
      "getBillByNumber",
      "getBillsByMember",
      "getBillCount",
      "searchBills",
      "getBillsBySubject",
      "getBills",
      "getDistinctSubjects",
      "getBillsWithoutSummary",
      "updateBillSummary",
    ];

    for (const name of expectedExports) {
      expect(billsModule).toHaveProperty(name);
      expect(typeof billsModule[name as keyof typeof billsModule]).toBe("function");
    }
  });
});

describe("BillWithSponsor type", () => {
  it("can be constructed with nested sponsor", () => {
    const bill: billsModule.BillWithSponsor = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      billNumber: "H.R.1234",
      billType: "hr",
      congress: 119,
      title: "Test Bill Act",
      summary: "A bill to test things",
      status: "introduced",
      subjects: ["Testing", "Development"],
      introducedDate: new Date("2025-01-15"),
      latestActionDate: new Date("2025-01-20"),
      latestActionText: "Referred to committee",
      sponsorBioguideId: "A000001",
      congressGovUrl: "https://congress.gov/bill/119th-congress/hr-bill/1234",
      createdAt: new Date(),
      updatedAt: new Date(),
      sponsor: {
        bioguideId: "A000001",
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        party: "D",
        state: "CA",
        district: "12",
        chamber: "house",
        title: "Representative",
        termStart: "2025-01-03",
        termEnd: "2027-01-03",
        phoneCapitol: null,
        phoneDistrict: null,
        fax: null,
        addressCapitol: null,
        addressDistrict: null,
        contactFormUrl: null,
        website: null,
        twitterHandle: null,
        facebookId: null,
        youtubeId: null,
        lisId: null,
      },
    };

    expect(bill.billNumber).toBe("H.R.1234");
    expect(bill.sponsor?.fullName).toBe("John Doe");
    expect(bill.subjects).toContain("Testing");
  });

  it("allows null sponsor", () => {
    const bill: billsModule.BillWithSponsor = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      billNumber: "S.567",
      billType: "s",
      congress: 119,
      title: "Test Senate Bill",
      summary: null,
      status: "introduced",
      subjects: [],
      introducedDate: new Date("2025-01-15"),
      latestActionDate: new Date("2025-01-15"),
      latestActionText: "Introduced",
      sponsorBioguideId: null,
      congressGovUrl: "https://congress.gov/bill/119th-congress/s-bill/567",
      createdAt: new Date(),
      updatedAt: new Date(),
      sponsor: null,
    };

    expect(bill.summary).toBeNull();
    expect(bill.sponsorBioguideId).toBeNull();
    expect(bill.sponsor).toBeNull();
  });
});

describe("GetBillsByMemberOptions interface", () => {
  it("allows all optional fields", () => {
    const options1: billsModule.GetBillsByMemberOptions = {};
    expect(options1.limit).toBeUndefined();

    const options2: billsModule.GetBillsByMemberOptions = {
      limit: 10,
      offset: 20,
      congress: 119,
      status: "passed_house",
    };
    expect(options2.limit).toBe(10);
    expect(options2.status).toBe("passed_house");
  });
});

describe("SearchBillsOptions interface", () => {
  it("allows all optional fields including billType", () => {
    const options1: billsModule.SearchBillsOptions = {};
    expect(options1.subject).toBeUndefined();

    const options2: billsModule.SearchBillsOptions = {
      limit: 25,
      offset: 0,
      congress: 118,
      status: "signed",
      subject: "Healthcare",
      billType: "hr",
    };
    expect(options2.subject).toBe("Healthcare");
    expect(options2.billType).toBe("hr");
  });
});

describe("BillFilterOptions interface", () => {
  it("supports bioguideId for unified count queries", () => {
    const options: billsModule.BillFilterOptions = {
      bioguideId: "A000001",
      congress: 119,
    };
    expect(options.bioguideId).toBe("A000001");
  });
});
