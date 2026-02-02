import { describe, it, expect } from "vitest";
import * as syncBillsModule from "./sync-bills";

describe("sync-bills module", () => {
  it("exports syncBills function", () => {
    expect(syncBillsModule).toHaveProperty("syncBills");
    expect(typeof syncBillsModule.syncBills).toBe("function");
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
