import { renderMarkdownToHtml } from "@/lib/markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
  "data-testid"?: string;
}

export function MarkdownContent({
  content,
  className = "",
  "data-testid": testId,
}: MarkdownContentProps) {
  const html = renderMarkdownToHtml(content);

  return (
    <div
      className={`markdown-preview ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid={testId}
    />
  );
}
