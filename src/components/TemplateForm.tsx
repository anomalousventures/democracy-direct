import { useState, useCallback } from "react";
import { Input } from "./ui/input";
import { LoadingButton } from "./ui/loading-button";
import {
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  BODY_MIN_LENGTH,
  BODY_MAX_LENGTH,
} from "@/lib/template-validation";

const ISSUE_TAG_OPTIONS = [
  "Healthcare",
  "Education",
  "Environment",
  "Economy",
  "Immigration",
  "Civil Rights",
  "Gun Policy",
  "Foreign Policy",
  "Social Security",
  "Infrastructure",
  "Veterans Affairs",
  "Housing",
];

interface TemplateFormProps {
  initialData?: {
    title: string;
    body: string;
    issueTags: string[];
  };
  onSubmit: (data: {
    title: string;
    body: string;
    issueTags: string[];
    turnstileToken?: string;
  }) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  turnstileSiteKey?: string;
}

export function TemplateForm({
  initialData,
  onSubmit,
  submitLabel = "Create Template",
  isSubmitting = false,
  turnstileSiteKey,
}: TemplateFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.issueTags || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < TITLE_MIN_LENGTH) {
      newErrors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters`;
    } else if (title.trim().length > TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters`;
    }

    if (!body.trim()) {
      newErrors.body = "Body is required";
    } else if (body.trim().length < BODY_MIN_LENGTH) {
      newErrors.body = `Body must be at least ${BODY_MIN_LENGTH} characters`;
    } else if (body.trim().length > BODY_MAX_LENGTH) {
      newErrors.body = `Body must be at most ${BODY_MAX_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, body]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      let turnstileToken: string | undefined;
      if (turnstileSiteKey) {
        const turnstileWidget = document.querySelector<HTMLInputElement>(
          '[name="cf-turnstile-response"]'
        );
        turnstileToken = turnstileWidget?.value;
      }

      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        issueTags: selectedTags,
        turnstileToken,
      });
    },
    [title, body, selectedTags, onSubmit, validate, turnstileSiteKey]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-[var(--color-civic-navy)]">
          Title
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your template a descriptive title"
          className="input-civic"
          data-testid="template-title-input"
          maxLength={TITLE_MAX_LENGTH}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{errors.title && <span className="text-red-500">{errors.title}</span>}</span>
          <span>
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="block text-sm font-medium text-[var(--color-civic-navy)]">
          Letter Body
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your letter template here. You can use {{REP_NAME}}, {{REP_TITLE}}, {{STATE}}, {{DISTRICT}} for auto-substitution..."
          className="input-civic min-h-[300px] resize-y font-mono text-sm"
          data-testid="template-body-input"
          maxLength={BODY_MAX_LENGTH}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {errors.body ? (
              <span className="text-red-500">{errors.body}</span>
            ) : (
              <span>Minimum {BODY_MIN_LENGTH} characters</span>
            )}
          </span>
          <span>
            {body.length}/{BODY_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-civic-navy)]">
          Issue Tags (optional)
        </label>
        <div className="flex flex-wrap gap-2" data-testid="issue-tag-selector">
          {ISSUE_TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-[var(--color-civic-navy)] text-white"
                  : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {turnstileSiteKey && (
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-testid="turnstile-widget"
        />
      )}

      <div className="pt-4">
        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText="Saving..."
          className="btn-primary w-full sm:w-auto"
          data-testid="submit-template-button"
        >
          {submitLabel}
        </LoadingButton>
      </div>
    </form>
  );
}
