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

  it("transforms a valid bill item", () => {
    const item = {
      ...baseBillItem,
      introducedDate: "2025-01-01",
      latestAction: {
        actionDate: "2025-01-15",
        text: "Referred to committee",
      },
      policyArea: { name: "Economics and Public Finance" },
      sponsors: [{ bioguideId: "A000001", fullName: "John Doe", party: "D", state: "CA" }],
    };

    const result = transformBillItem(item);

    expect(result.data).not.toBeNull();
    expect(result.data?.billNumber).toBe("HR.1");
    expect(result.data?.billType).toBe("hr");
    expect(result.data?.congress).toBe(119);
    expect(result.data?.status).toBe("introduced");
    expect(result.data?.subjects).toEqual(["Economics and Public Finance"]);
    expect(result.data?.sponsorBioguideId).toBe("A000001");
    expect(result.error).toBeNull();
  });

  it("returns error for unparseable bill number", () => {
    const item = {
      ...baseBillItem,
      type: "invalid",
      introducedDate: "2025-01-01",
    };

    const result = transformBillItem(item);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.error).toBe("Failed to parse bill number");
  });

  it("uses latestActionDate as fallback when introducedDate is missing", () => {
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
    expect(result.error).not.toBeNull();
    expect(result.error?.error).toBe("Missing introducedDate, used latestActionDate as fallback");
  });

  it("returns error when both introducedDate and latestActionDate are missing", () => {
    const item = {
      ...baseBillItem,
    };

    const result = transformBillItem(item);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.error).toBe("Missing both introducedDate and latestActionDate");
  });

  it("handles bill without sponsor", () => {
    const item = {
      ...baseBillItem,
      introducedDate: "2025-01-01",
    };

    const result = transformBillItem(item);

    expect(result.data?.sponsorBioguideId).toBeNull();
  });

  it("handles bill without policyArea", () => {
    const item = {
      ...baseBillItem,
      introducedDate: "2025-01-01",
    };

    const result = transformBillItem(item);

    expect(result.data?.subjects).toEqual([]);
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
    };

    expect(result.direction).toBe("backward");
    expect(result.cursorPosition).toBeNull();
    expect(result.oldestCongress).toBe(118);
  });

  it("tracks errors during sync", () => {
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
        { billNumber: "HR1234", error: "Failed to parse bill" },
        { billNumber: "S567", error: "Network timeout" },
      ],
    };

    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].billNumber).toBe("HR1234");
    expect(result.errors[1].error).toBe("Network timeout");
  });
});
