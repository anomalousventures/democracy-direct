import { useState } from "react";
import { MarkdownContent } from "./MarkdownContent";

interface ExpandableContentProps {
  content: string;
  collapsedHeight?: number;
  className?: string;
}

export function ExpandableContent({
  content,
  collapsedHeight = 200,
  className = "",
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongContent = content.length > 1000;

  if (!isLongContent) {
    return <MarkdownContent content={content} className={className} />;
  }

  return (
    <div className={className}>
      <div
        className={`overflow-hidden transition-all duration-300`}
        style={isExpanded ? undefined : { maxHeight: `${collapsedHeight}px` }}
      >
        <MarkdownContent content={content} />
      </div>
      {!isExpanded && (
        <div className="relative">
          <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-sm text-primary hover:text-accent font-medium transition-colors"
        type="button"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
