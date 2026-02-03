import { describe, it, expect } from "vitest";
import {
  markdownToPlainText,
  plainTextToMarkdown,
  getPreviewLines,
  renderMarkdownToHtml,
} from "./markdown";

describe("markdownToPlainText", () => {
  it("converts bullet list markers to visual bullets", () => {
    const md = "- First item\n- Second item";
    const result = markdownToPlainText(md);
    expect(result).toBe("• First item\n• Second item");
  });

  it("converts asterisk list markers to visual bullets", () => {
    const md = "* First item\n* Second item";
    const result = markdownToPlainText(md);
    expect(result).toBe("• First item\n• Second item");
  });

  it("preserves numbered lists", () => {
    const md = "1. First item\n2. Second item";
    const result = markdownToPlainText(md);
    expect(result).toBe("1. First item\n2. Second item");
  });

  it("strips bold formatting", () => {
    const md = "This is **bold** text";
    const result = markdownToPlainText(md);
    expect(result).toBe("This is bold text");
  });

  it("strips italic formatting with asterisks", () => {
    const md = "This is *italic* text";
    const result = markdownToPlainText(md);
    expect(result).toBe("This is italic text");
  });

  it("strips italic formatting with underscores", () => {
    const md = "This is _italic_ text";
    const result = markdownToPlainText(md);
    expect(result).toBe("This is italic text");
  });

  it("strips inline code", () => {
    const md = "Use the `someFunction()` method";
    const result = markdownToPlainText(md);
    expect(result).toBe("Use the someFunction() method");
  });

  it("strips link formatting but keeps text", () => {
    const md = "Visit [our website](https://example.com) for more";
    const result = markdownToPlainText(md);
    expect(result).toBe("Visit our website for more");
  });

  it("normalizes multiple newlines", () => {
    const md = "First paragraph\n\n\n\nSecond paragraph";
    const result = markdownToPlainText(md);
    expect(result).toBe("First paragraph\n\nSecond paragraph");
  });

  it("returns empty string for empty input", () => {
    expect(markdownToPlainText("")).toBe("");
  });

  it("preserves template variables", () => {
    const md = "Dear {{REP_NAME}},\n\nI am writing to you.";
    const result = markdownToPlainText(md);
    expect(result).toBe("Dear {{REP_NAME}},\n\nI am writing to you.");
  });
});

describe("plainTextToMarkdown", () => {
  it("converts bullet characters to markdown list markers", () => {
    const text = "• First item\n• Second item";
    const result = plainTextToMarkdown(text);
    expect(result).toBe("- First item\n- Second item");
  });

  it("preserves numbered lists", () => {
    const text = "1. First item\n2. Second item";
    const result = plainTextToMarkdown(text);
    expect(result).toBe("1. First item\n2. Second item");
  });

  it("preserves regular paragraphs", () => {
    const text = "This is a paragraph.\n\nThis is another paragraph.";
    const result = plainTextToMarkdown(text);
    expect(result).toBe("This is a paragraph.\n\nThis is another paragraph.");
  });

  it("returns empty string for empty input", () => {
    expect(plainTextToMarkdown("")).toBe("");
  });
});

describe("getPreviewLines", () => {
  it("returns first 3 lines by default", () => {
    const md = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    const result = getPreviewLines(md);
    expect(result).toBe("Line 1\nLine 2\nLine 3");
  });

  it("returns specified number of lines", () => {
    const md = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    const result = getPreviewLines(md, 2);
    expect(result).toBe("Line 1\nLine 2");
  });

  it("returns all lines if fewer than requested", () => {
    const md = "Line 1\nLine 2";
    const result = getPreviewLines(md, 5);
    expect(result).toBe("Line 1\nLine 2");
  });

  it("strips markdown formatting", () => {
    const md = "**Bold line**\n*Italic line*\n- List item";
    const result = getPreviewLines(md);
    expect(result).toBe("Bold line\nItalic line\n• List item");
  });

  it("skips empty lines", () => {
    const md = "Line 1\n\n\nLine 2\nLine 3";
    const result = getPreviewLines(md);
    expect(result).toBe("Line 1\nLine 2\nLine 3");
  });

  it("returns empty string for empty input", () => {
    expect(getPreviewLines("")).toBe("");
  });
});

describe("renderMarkdownToHtml", () => {
  it("renders paragraphs", () => {
    const md = "First paragraph\n\nSecond paragraph";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe("<p>First paragraph</p><p>Second paragraph</p>");
  });

  it("renders unordered lists", () => {
    const md = "- Item 1\n- Item 2";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe("<ul><li>Item 1</li><li>Item 2</li></ul>");
  });

  it("renders ordered lists", () => {
    const md = "1. Item 1\n2. Item 2";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe("<ol><li>Item 1</li><li>Item 2</li></ol>");
  });

  it("renders bold text", () => {
    const md = "This is **bold** text";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe("<p>This is <strong>bold</strong> text</p>");
  });

  it("renders italic text", () => {
    const md = "This is *italic* text";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe("<p>This is <em>italic</em> text</p>");
  });

  it("escapes HTML entities", () => {
    const md = "Use <script> and & characters";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe("<p>Use &lt;script&gt; and &amp; characters</p>");
  });

  it("preserves template variables", () => {
    const md = "Dear {{REP_NAME}}";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe("<p>Dear {{REP_NAME}}</p>");
  });

  it("returns empty string for empty input", () => {
    expect(renderMarkdownToHtml("")).toBe("");
  });

  it("handles mixed content", () => {
    const md = "Hello **world**\n\n- First\n- Second\n\nGoodbye";
    const result = renderMarkdownToHtml(md);
    expect(result).toBe(
      "<p>Hello <strong>world</strong></p><ul><li>First</li><li>Second</li></ul><p>Goodbye</p>"
    );
  });
});
