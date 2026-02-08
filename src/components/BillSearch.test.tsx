import { describe, it, expect } from "vitest";
import { parseSearchParams, serializeSearchParams } from "./BillSearch";

describe("parseSearchParams", () => {
  it("parses empty search string", () => {
    const result = parseSearchParams("");
    expect(result).toEqual({
      q: "",
      congress: undefined,
      types: [],
      statuses: [],
      subjects: [],
    });
  });

  it("parses query param", () => {
    const result = parseSearchParams("?q=education");
    expect(result.q).toBe("education");
  });

  it("parses congress param", () => {
    const result = parseSearchParams("?congress=119");
    expect(result.congress).toBe(119);
  });

  it("ignores invalid congress param", () => {
    const result = parseSearchParams("?congress=abc");
    expect(result.congress).toBeUndefined();
  });

  it("parses congress=all as null", () => {
    const result = parseSearchParams("?congress=all");
    expect(result.congress).toBeNull();
  });

  it("parses comma-separated type params", () => {
    const result = parseSearchParams("?type=hr,s");
    expect(result.types).toEqual(["hr", "s"]);
  });

  it("filters out invalid bill types", () => {
    const result = parseSearchParams("?type=hr,invalid,s");
    expect(result.types).toEqual(["hr", "s"]);
  });

  it("parses comma-separated status params", () => {
    const result = parseSearchParams("?status=introduced,became_law");
    expect(result.statuses).toEqual(["introduced", "became_law"]);
  });

  it("parses comma-separated subject params", () => {
    const result = parseSearchParams("?subject=Health,Education");
    expect(result.subjects).toEqual(["Health", "Education"]);
  });

  it("parses full search string", () => {
    const result = parseSearchParams(
      "?q=tax&congress=119&type=hr&status=introduced&subject=Finance"
    );
    expect(result).toEqual({
      q: "tax",
      congress: 119,
      types: ["hr"],
      statuses: ["introduced"],
      subjects: ["Finance"],
    });
  });
});

describe("serializeSearchParams", () => {
  it("returns empty string for default state", () => {
    const result = serializeSearchParams({
      q: "",
      congress: undefined,
      types: [],
      statuses: [],
      subjects: [],
    });
    expect(result).toBe("");
  });

  it("serializes congress=null as congress=all", () => {
    const result = serializeSearchParams({
      q: "",
      congress: null,
      types: [],
      statuses: [],
      subjects: [],
    });
    expect(result).toBe("congress=all");
  });

  it("serializes query", () => {
    const result = serializeSearchParams({
      q: "education",
      congress: undefined,
      types: [],
      statuses: [],
      subjects: [],
    });
    expect(result).toBe("q=education");
  });

  it("serializes non-default congress", () => {
    const result = serializeSearchParams({
      q: "",
      congress: 118,
      types: [],
      statuses: [],
      subjects: [],
    });
    expect(result).toBe("congress=118");
  });

  it("omits default congress from serialization", () => {
    const result = serializeSearchParams({
      q: "",
      congress: 119,
      types: [],
      statuses: [],
      subjects: [],
    });
    expect(result).toBe("");
  });

  it("serializes types as comma-separated", () => {
    const result = serializeSearchParams({
      q: "",
      congress: undefined,
      types: ["hr", "s"],
      statuses: [],
      subjects: [],
    });
    expect(result).toBe("type=hr%2Cs");
  });

  it("serializes full state", () => {
    const result = serializeSearchParams({
      q: "tax",
      congress: 118,
      types: ["hr"],
      statuses: ["introduced"],
      subjects: ["Finance"],
    });
    const params = new URLSearchParams(result);
    expect(params.get("q")).toBe("tax");
    expect(params.get("congress")).toBe("118");
    expect(params.get("type")).toBe("hr");
    expect(params.get("status")).toBe("introduced");
    expect(params.get("subject")).toBe("Finance");
  });

  it("omits default congress (119) from serialization", () => {
    const result = serializeSearchParams({
      q: "tax",
      congress: 119,
      types: [],
      statuses: [],
      subjects: [],
    });
    const params = new URLSearchParams(result);
    expect(params.get("q")).toBe("tax");
    expect(params.get("congress")).toBeNull();
  });

  it("round-trips through parse with specific congress", () => {
    const original = {
      q: "climate",
      congress: 118 as number | null | undefined,
      types: ["hr", "s"] as ("hr" | "s")[],
      statuses: ["passed_house"] as "passed_house"[],
      subjects: ["Environment"],
    };
    const serialized = serializeSearchParams(original);
    const parsed = parseSearchParams(`?${serialized}`);
    expect(parsed).toEqual(original);
  });

  it("round-trips through parse with congress=null (all)", () => {
    const original = {
      q: "climate",
      congress: null as number | null | undefined,
      types: ["hr"] as "hr"[],
      statuses: [] as never[],
      subjects: [],
    };
    const serialized = serializeSearchParams(original);
    expect(serialized).toContain("congress=all");
    const parsed = parseSearchParams(`?${serialized}`);
    expect(parsed).toEqual(original);
  });
});
