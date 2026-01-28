import { useState, useCallback, useMemo } from "react";
import { type Representative, getRepresentativeTitle } from "../types/representative";

interface LetterComposerProps {
  representative: Representative;
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

function substituteVariables(content: string, rep: Representative): string {
  const variables: Record<string, string> = {
    REP_NAME: `${rep.first_name} ${rep.last_name}`,
    REP_FIRST: rep.first_name,
    REP_LAST: rep.last_name,
    REP_TITLE: getRepresentativeTitle(rep),
    REP_PARTY: rep.party,
    STATE: rep.state,
    DISTRICT: rep.district || "At-Large",
    TODAY_DATE: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] ?? match;
  });
}

export function LetterComposer({
  representative,
  initialContent = "",
  onContentChange,
}: LetterComposerProps) {
  const [content, setContent] = useState(initialContent);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      onContentChange?.(newContent);
    },
    [onContentChange]
  );

  const preview = useMemo(
    () => substituteVariables(content, representative),
    [content, representative]
  );

  const characterCount = content.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="letter-content"
          className="block text-sm font-medium text-[var(--color-civic-navy)]"
        >
          Your Letter
        </label>
        <textarea
          id="letter-content"
          value={content}
          onChange={handleChange}
          placeholder="Write your letter here. Use {{REP_NAME}}, {{REP_TITLE}}, {{STATE}}, {{DISTRICT}} for auto-substitution..."
          className="input-civic min-h-[200px] resize-y font-mono text-sm"
          rows={10}
        />
        <div className="flex justify-between text-sm text-[var(--color-muted-foreground)]">
          <span>Tip: Variables like {"{{REP_NAME}}"} will be replaced automatically</span>
          <span>
            <span className="font-medium">{characterCount}</span> characters
          </span>
        </div>
      </div>

      {content && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-civic-navy)]">
            Preview
          </label>
          <div
            data-testid="letter-preview"
            className="p-4 bg-white border border-[var(--color-border)] min-h-[100px] whitespace-pre-wrap text-sm"
          >
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}
