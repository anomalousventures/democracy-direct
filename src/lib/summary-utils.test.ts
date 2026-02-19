import { describe, it, expect } from "vitest";
import { selectBestSummary, stripHtmlTags, truncateSummary } from "./summary-utils";

describe("stripHtmlTags", () => {
  it("removes HTML tags", () => {
    expect(stripHtmlTags("<p>Hello</p>")).toBe("Hello");
    expect(stripHtmlTags("<b>Bold</b> and <i>italic</i>")).toBe("Bold and italic");
  });

  it("decodes HTML entities", () => {
    expect(stripHtmlTags("&amp; &lt; &gt; &quot; &#39;")).toBe("& < > \" '");
    expect(stripHtmlTags("non&nbsp;breaking")).toBe("non breaking");
  });

  it("preserves space between adjacent HTML elements", () => {
    expect(stripHtmlTags("<p>Title 2025</p><p>This bill</p>")).toBe("Title 2025 This bill");
  });

  it("normalizes whitespace", () => {
    expect(stripHtmlTags("  too   many    spaces  ")).toBe("too many spaces");
    expect(stripHtmlTags("<p>line1</p>\n\n<p>line2</p>")).toBe("line1 line2");
  });

  it("handles complex HTML", () => {
    const html = `<p><b>This bill</b> authorizes the &amp; requires the
      <a href="#">Department</a> to submit a report.</p>`;
    expect(stripHtmlTags(html)).toBe(
      "This bill authorizes the & requires the Department to submit a report."
    );
  });
});

describe("truncateSummary", () => {
  it("returns short text unchanged", () => {
    expect(truncateSummary("short text")).toBe("short text");
  });

  it("returns text at exactly maxLength unchanged", () => {
    const text = "a".repeat(100);
    expect(truncateSummary(text, 100)).toBe(text);
  });

  it("truncates at word boundary and appends ellipsis", () => {
    const text = "word ".repeat(20).trim();
    const result = truncateSummary(text, 30);
    expect(result.endsWith("...")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(33);
    expect(result).not.toContain("  ");
  });

  it("truncates mid-word when no space in last 20% of text", () => {
    const text = "a".repeat(200);
    const result = truncateSummary(text, 100);
    expect(result).toBe("a".repeat(100) + "...");
  });

  it("uses default maxLength of 10000", () => {
    const short = "a".repeat(9999);
    expect(truncateSummary(short)).toBe(short);

    const long = "word ".repeat(3000);
    const result = truncateSummary(long);
    expect(result.length).toBeLessThanOrEqual(10_003);
    expect(result.endsWith("...")).toBe(true);
  });
});

describe("selectBestSummary", () => {
  it("returns null for empty array", () => {
    expect(selectBestSummary([])).toBe(null);
  });

  it("returns the only summary when there is one", () => {
    const summaries = [
      {
        versionCode: "00",
        actionDate: "2024-01-01",
        actionDesc: "Introduced",
        text: "<p>Test summary</p>",
        updateDate: "2024-01-01",
      },
    ];
    expect(selectBestSummary(summaries)).toBe("Test summary");
  });

  it("prioritizes by version code (passed congress over introduced)", () => {
    const summaries = [
      {
        versionCode: "00",
        actionDate: "2024-01-01",
        actionDesc: "Introduced in House",
        text: "<p>Introduced version</p>",
        updateDate: "2024-06-01",
      },
      {
        versionCode: "36",
        actionDate: "2024-03-15",
        actionDesc: "Passed Congress",
        text: "<p>Final version</p>",
        updateDate: "2024-03-15",
      },
    ];
    expect(selectBestSummary(summaries)).toBe("Final version");
  });

  it("prioritizes enrolled bill over passed senate", () => {
    const summaries = [
      {
        versionCode: "35",
        actionDate: "2024-02-01",
        actionDesc: "Passed Senate",
        text: "Senate version",
        updateDate: "2024-02-01",
      },
      {
        versionCode: "28",
        actionDate: "2024-03-01",
        actionDesc: "Enrolled Bill",
        text: "Enrolled version",
        updateDate: "2024-03-01",
      },
    ];
    expect(selectBestSummary(summaries)).toBe("Enrolled version");
  });

  it("falls back to updateDate when version codes are equal", () => {
    const summaries = [
      {
        versionCode: "00",
        actionDate: "2024-01-01",
        actionDesc: "Introduced in House",
        text: "Older version",
        updateDate: "2024-01-01",
      },
      {
        versionCode: "00",
        actionDate: "2024-01-01",
        actionDesc: "Introduced in House",
        text: "Newer version",
        updateDate: "2024-02-15",
      },
    ];
    expect(selectBestSummary(summaries)).toBe("Newer version");
  });

  it("handles unknown version codes with fallback priority", () => {
    const summaries = [
      {
        versionCode: "99",
        actionDate: "2024-01-01",
        actionDesc: "Unknown",
        text: "Unknown version",
        updateDate: "2024-06-01",
      },
      {
        versionCode: "36",
        actionDate: "2024-03-01",
        actionDesc: "Passed Congress",
        text: "Known version",
        updateDate: "2024-03-01",
      },
    ];
    expect(selectBestSummary(summaries)).toBe("Known version");
  });
});
