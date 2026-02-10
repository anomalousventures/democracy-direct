import { escapeXml } from "@/lib/escape";

/**
 * Markdown utilities for template storage and clipboard conversion.
 *
 * Storage: Markdown format
 * Clipboard: Plain text with visual bullets (• instead of -)
 */

/**
 * Convert markdown to plain text for clipboard pasting into .gov contact forms.
 * - Converts `- item` to `• item` for visual bullets
 * - Keeps numbered lists as-is (1. item)
 * - Strips **bold** and *italic* formatting
 * - Preserves newlines and paragraph structure
 */
export function markdownToPlainText(md: string): string {
  if (!md) return "";

  let result = md;

  // Convert unordered list markers to bullets
  result = result.replace(/^[-*]\s+/gm, "• ");

  // Strip bold formatting (**text** or __text__)
  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  result = result.replace(/__(.+?)__/g, "$1");

  // Strip italic formatting (*text* or _text_)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, "$1");

  // Strip inline code
  result = result.replace(/`([^`]+)`/g, "$1");

  // Strip links but keep text [text](url) -> text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Normalize multiple newlines to double newlines (paragraph breaks)
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Convert plain text (possibly from old format) to markdown.
 * - Converts `• item` to `- item` for markdown bullets
 * - Preserves numbered lists
 * - Preserves paragraph structure
 */
export function plainTextToMarkdown(text: string): string {
  if (!text) return "";

  let result = text;

  // Convert bullet characters to markdown list markers
  result = result.replace(/^[•]\s*/gm, "- ");

  return result.trim();
}

/**
 * Extract first N lines from markdown for preview snippets.
 * Strips formatting for clean display.
 */
export function getPreviewLines(md: string, lineCount: number = 3): string {
  if (!md) return "";

  const lines = md.split("\n").filter((line) => line.trim());
  const previewLines = lines.slice(0, lineCount);

  return markdownToPlainText(previewLines.join("\n"));
}

/**
 * Render markdown to HTML for preview display.
 * Uses a simple regex-based approach for the limited markdown subset we support.
 * Preserves {{VARIABLE}} patterns without modification.
 */
export function renderMarkdownToHtml(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const result: string[] = [];
  let inList: "ul" | "ol" | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for unordered list item
    const bulletMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (inList !== "ul") {
        if (inList === "ol") result.push("</ol>");
        result.push("<ul>");
        inList = "ul";
      }
      result.push(`<li>${formatInlineMarkdown(escapeXml(bulletMatch[1]))}</li>`);
      continue;
    }

    // Check for ordered list item
    const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (inList !== "ol") {
        if (inList === "ul") result.push("</ul>");
        result.push("<ol>");
        inList = "ol";
      }
      result.push(`<li>${formatInlineMarkdown(escapeXml(orderedMatch[2]))}</li>`);
      continue;
    }

    // Close any open list
    if (inList) {
      result.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }

    // Empty line = paragraph break
    if (!trimmedLine) {
      continue;
    }

    // Regular paragraph
    result.push(`<p>${formatInlineMarkdown(escapeXml(trimmedLine))}</p>`);
  }

  // Close any open list at the end
  if (inList) {
    result.push(inList === "ul" ? "</ul>" : "</ol>");
  }

  return result.join("");
}

function formatInlineMarkdown(text: string): string {
  let result = text;

  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_ (not already part of bold)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");

  return result;
}
