import { describe, it, expect } from "vitest";
import * as syncBillsModule from "./sync-bills";
import { inferBillStatus, transformBillItem } from "./sync-bills";

describe("sync-bills module", () => {
  it("exports syncBills function", () => {
    expect(syncBillsModule).toHaveProperty("syncBills");
    expect(typeof syncBillsModule.syncBills).toBe("function");
  });

  it("exports inferBillStatus function", () => {
    expect(syncBillsModule).toHaveProperty("inferBillStatus");
    expect(typeof syncBillsModule.inferBillStatus).toBe("function");
  });

  it("exports transformBillItem function", () => {
    expect(syncBillsModule).toHaveProperty("transformBillItem");
    expect(typeof syncBillsModule.transformBillItem).toBe("function");
  });

  it("exports SyncBillsResult type", () => {
    const result: syncBillsModule.SyncBillsResult = {
      source: "congress.gov",
      changed: true,
      direction: "forward",
      congressNumber: 119,
      billsUpserted: 10,
      duration: "1.5s",
      cursorPosition: "2025-01-01T00:00:00.000Z",
      oldestCongress: 117,
      errors: [],
      warnings: [],
    };

    expect(result.source).toBe("congress.gov");
    expect(result.direction).toBe("forward");
    expect(result.billsUpserted).toBe(10);
  });
});

describe("inferBillStatus", () => {
  it("returns 'became_law' for became public law", () => {
    expect(inferBillStatus("Became Public Law No: 119-1")).toBe("became_law");
    expect(inferBillStatus("Became law after veto")).toBe("became_law");
  });

  it("returns 'signed' for presidential signature", () => {
    expect(inferBillStatus("Signed by President")).toBe("signed");
    expect(inferBillStatus("Signed by the President")).toBe("signed");
  });

  it("returns 'vetoed' for vetoed bills", () => {
    expect(inferBillStatus("Vetoed by President")).toBe("vetoed");
    expect(inferBillStatus("Message on vetoed bill")).toBe("vetoed");
  });

  it("returns 'veto_overridden' for overridden vetoes", () => {
    expect(inferBillStatus("Bill was vetoed, but veto overridden by House")).toBe(
      "veto_overridden"
    );
    expect(inferBillStatus("Vetoed by President. Veto Overridden in Senate")).toBe(
      "veto_overridden"
    );
  });

  it("returns 'to_president' for bills sent to president", () => {
    expect(inferBillStatus("Presented to President")).toBe("to_president");
    expect(inferBillStatus("Sent to the President")).toBe("to_president");
  });

  it("returns 'resolving_differences' for conference activity", () => {
    expect(inferBillStatus("Resolving differences between House and Senate")).toBe(
      "resolving_differences"
    );
  });

  it("returns 'passed_senate' for Senate passage", () => {
    expect(inferBillStatus("Passed Senate with amendments")).toBe("passed_senate");
    expect(inferBillStatus("Passed/Agreed to in Senate: 89-10")).toBe("passed_senate");
  });

  it("returns 'passed_house' for House passage", () => {
    expect(inferBillStatus("Passed House")).toBe("passed_house");
    expect(inferBillStatus("Passed/agreed to in House")).toBe("passed_house");
  });

  it("returns 'introduced' for new bills", () => {
    expect(inferBillStatus("Introduced")).toBe("introduced");
    expect(inferBillStatus("Referred to committee")).toBe("introduced");
    expect(inferBillStatus("Some random action text")).toBe("introduced");
  });

  it("handles case insensitivity", () => {
    expect(inferBillStatus("BECAME PUBLIC LAW")).toBe("became_law");
    expect(inferBillStatus("signed by PRESIDENT")).toBe("signed");
    expect(inferBillStatus("VETOED")).toBe("vetoed");
    expect(inferBillStatus("PASSED SENATE")).toBe("passed_senate");
    expect(inferBillStatus("passed house")).toBe("passed_house");
  });

  it("handles empty string", () => {
    expect(inferBillStatus("")).toBe("introduced");
  });

  it("returns vetoed when only vetoed (no override)", () => {
    expect(inferBillStatus("Bill was vetoed by President")).toBe("vetoed");
  });

  it("prioritizes veto_overridden when both vetoed and override present", () => {
    expect(inferBillStatus("Vetoed by President, then veto overridden by Congress")).toBe(
      "veto_overridden"
    );
  });
});

describe("transformBillItem", () => {
  const baseBillItem = {
    congress: 119,
    type: "hr",
    number: 1,
    title: "Test Bill",
    url: "https://api.congress.gov/v3/bill/119/hr/1",
  };

  it("transforms a valid bill item with detailIntroducedDate", () => {
    const item = {
      ...baseBillItem,
      latestAction: {
        actionDate: "2025-01-15",
        text: "Referred to committee",
      },
      policyArea: { name: "Economics and Public Finance" },
      sponsors: [{ bioguideId: "A000001", fullName: "John Doe", party: "D", state: "CA" }],
    };

    const result = transformBillItem(item, "2025-01-01");

    expect(result.data).not.toBeNull();
    expect(result.data?.billNumber).toBe("HR.1");
    expect(result.data?.billType).toBe("hr");
    expect(result.data?.congress).toBe(119);
    expect(result.data?.introducedDate).toEqual(new Date("2025-01-01"));
    expect(result.data?.status).toBe("introduced");
    expect(result.data?.subjects).toEqual(["Economics and Public Finance"]);
    expect(result.data?.sponsorBioguideId).toBe("A000001");
    expect(result.warning).toBeNull();
    expect(result.error).toBeNull();
  });

  it("returns error for unparseable bill number", () => {
    const item = {
      ...baseBillItem,
      type: "invalid",
    };

    const result = transformBillItem(item, "2025-01-01");

    expect(result.data).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toBe("Failed to parse bill number");
  });

  it("uses latestActionDate as fallback when detailIntroducedDate is not provided (warning)", () => {
    const item = {
      ...baseBillItem,
      latestAction: {
        actionDate: "2025-01-15",
        text: "Passed House",
      },
    };

    const result = transformBillItem(item);

    expect(result.data).not.toBeNull();
    expect(result.data?.introducedDate).toEqual(new Date("2025-01-15"));
    expect(result.warning).not.toBeNull();
    expect(result.warning?.message).toBe("Detail fetch failed, used latestActionDate as fallback");
    expect(result.error).toBeNull();
  });

  it("returns error when both detailIntroducedDate and latestActionDate are missing", () => {
    const item = {
      ...baseBillItem,
    };

    const result = transformBillItem(item);

    expect(result.data).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toBe("Missing both introducedDate and latestActionDate");
  });

  it("handles bill without sponsor", () => {
    const item = {
      ...baseBillItem,
    };

    const result = transformBillItem(item, "2025-01-01");

    expect(result.data?.sponsorBioguideId).toBeNull();
    expect(result.warning).toBeNull();
    expect(result.error).toBeNull();
  });

  it("handles bill without policyArea", () => {
    const item = {
      ...baseBillItem,
    };

    const result = transformBillItem(item, "2025-01-01");

    expect(result.data?.subjects).toEqual([]);
    expect(result.warning).toBeNull();
    expect(result.error).toBeNull();
  });

  it("prefers detailIntroducedDate over latestActionDate", () => {
    const item = {
      ...baseBillItem,
      latestAction: {
        actionDate: "2025-02-15",
        text: "Passed House",
      },
    };

    const result = transformBillItem(item, "2025-01-01");

    expect(result.data?.introducedDate).toEqual(new Date("2025-01-01"));
    expect(result.data?.latestActionDate).toEqual(new Date("2025-02-15"));
    expect(result.warning).toBeNull();
  });
});

describe("SyncBillsResult structure", () => {
  it("has correct structure for forward sync", () => {
    const result: syncBillsModule.SyncBillsResult = {
      source: "congress.gov",
      changed: true,
      direction: "forward",
      congressNumber: 119,
      billsUpserted: 100,
      duration: "30.5s",
      cursorPosition: "2025-02-01T12:00:00.000Z",
      oldestCongress: null,
      errors: [],
      warnings: [],
    };

    expect(result.direction).toBe("forward");
    expect(result.cursorPosition).not.toBeNull();
    expect(result.oldestCongress).toBeNull();
  });

  it("has correct structure for backward sync", () => {
    const result: syncBillsModule.SyncBillsResult = {
      source: "congress.gov",
      changed: true,
      direction: "backward",
      congressNumber: 118,
      billsUpserted: 3000,
      duration: "120.0s",
      cursorPosition: null,
      oldestCongress: 118,
      errors: [],
      warnings: [],
    };

    expect(result.direction).toBe("backward");
    expect(result.cursorPosition).toBeNull();
    expect(result.oldestCongress).toBe(118);
  });

  it("tracks errors during sync (fatal issues)", () => {
    const result: syncBillsModule.SyncBillsResult = {
      source: "congress.gov",
      changed: true,
      direction: "forward",
      congressNumber: 119,
      billsUpserted: 95,
      duration: "30.0s",
      cursorPosition: "2025-02-01T00:00:00.000Z",
      oldestCongress: null,
      errors: [
        { billNumber: "HR1234", message: "Failed to parse bill" },
        { billNumber: "S567", message: "Missing both dates" },
      ],
      warnings: [],
    };

    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].billNumber).toBe("HR1234");
    expect(result.errors[1].message).toBe("Missing both dates");
  });

  it("tracks warnings during sync (recoverable issues)", () => {
    const result: syncBillsModule.SyncBillsResult = {
      source: "congress.gov",
      changed: true,
      direction: "forward",
      congressNumber: 119,
      billsUpserted: 100,
      duration: "30.0s",
      cursorPosition: "2025-02-01T00:00:00.000Z",
      oldestCongress: null,
      errors: [],
      warnings: [
        {
          billNumber: "HR123",
          message: "Missing introducedDate, used latestActionDate as fallback",
        },
        {
          billNumber: "S456",
          message: "Missing introducedDate, used latestActionDate as fallback",
        },
      ],
    };

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0].billNumber).toBe("HR123");
    expect(result.warnings[1].message).toBe(
      "Missing introducedDate, used latestActionDate as fallback"
    );
  });

  it("tracks both errors and warnings separately", () => {
    const result: syncBillsModule.SyncBillsResult = {
      source: "congress.gov",
      changed: true,
      direction: "forward",
      congressNumber: 119,
      billsUpserted: 98,
      duration: "30.0s",
      cursorPosition: "2025-02-01T00:00:00.000Z",
      oldestCongress: null,
      errors: [
        { billNumber: "HR999", message: "Missing both introducedDate and latestActionDate" },
      ],
      warnings: [
        {
          billNumber: "HR123",
          message: "Missing introducedDate, used latestActionDate as fallback",
        },
      ],
    };

    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.billsUpserted).toBe(98);
  });
});
