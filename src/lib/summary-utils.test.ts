import { describe, it, expect } from "vitest";
import { selectBestSummary, stripHtmlTags } from "./summary-utils";

describe("stripHtmlTags", () => {
  it("removes HTML tags", () => {
    expect(stripHtmlTags("<p>Hello</p>")).toBe("Hello");
    expect(stripHtmlTags("<b>Bold</b> and <i>italic</i>")).toBe("Bold and italic");
  });

  it("decodes HTML entities", () => {
    expect(stripHtmlTags("&amp; &lt; &gt; &quot; &#39;")).toBe("& < > \" '");
    expect(stripHtmlTags("non&nbsp;breaking")).toBe("non breaking");
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
