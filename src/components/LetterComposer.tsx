import { useState, useCallback, useMemo } from "react";
import { type Representative, getRepresentativeTitle } from "../types/representative";
import { substituteForRepresentative, type TemplateAddress } from "@/lib/template-variables";
import { TiptapEditor } from "./TiptapEditor";

interface LetterComposerProps {
  representative: Representative;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  userInfo?: TemplateAddress;
}

export function LetterComposer({
  representative,
  initialContent = "",
  onContentChange,
  userInfo,
}: LetterComposerProps) {
  const [content, setContent] = useState(initialContent);

  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    },
    [onContentChange]
  );

  const preview = useMemo(
    () => substituteForRepresentative(content, representative, userInfo),
    [content, representative, userInfo]
  );

  const repTitle = getRepresentativeTitle(representative);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="letter-content" className="block text-sm font-medium text-primary">
          Your Letter
        </label>
        <TiptapEditor
          id="letter-content"
          content={content}
          onChange={handleChange}
          placeholder={`Write your letter to ${repTitle} ${representative.last_name}. Use {{REP_NAME}}, {{REP_TITLE}}, {{STATE}}, {{DISTRICT}} for auto-substitution...`}
        />
      </div>

      {content && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary">Preview</label>
          <div
            data-testid="letter-preview"
            className="p-4 bg-white border border-border min-h-[100px] whitespace-pre-wrap text-sm"
          >
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}
