import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { LoadingButton } from "./ui/loading-button";
import { TiptapEditor } from "./TiptapEditor";
import {
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  BODY_MIN_LENGTH,
  BODY_MAX_LENGTH,
} from "@/lib/template-validation";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const renderTurnstile = () => {
      if (turnstileRef.current && window.turnstile && turnstileSiteKey) {
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
        }
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: turnstileSiteKey,
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };

    const timer = setTimeout(renderTurnstile, 100);
    return () => {
      clearTimeout(timer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [turnstileSiteKey]);

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
      if (turnstileSiteKey && !turnstileToken) return;

      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        issueTags: selectedTags,
        turnstileToken: turnstileToken ?? undefined,
      });
    },
    [title, body, selectedTags, onSubmit, validate, turnstileSiteKey, turnstileToken]
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
          aria-invalid={errors.title ? "true" : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {errors.title && (
              <span id="title-error" className="text-red-500">
                {errors.title}
              </span>
            )}
          </span>
          <span>
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="block text-sm font-medium text-[var(--color-civic-navy)]">
          Letter Body
        </label>
        <TiptapEditor
          content={body}
          onChange={setBody}
          placeholder="Write your letter template here..."
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {errors.body ? (
              <span id="body-error" className="text-red-500">
                {errors.body}
              </span>
            ) : (
              <span id="body-hint">Minimum {BODY_MIN_LENGTH} characters</span>
            )}
          </span>
          <span>
            {body.length}/{BODY_MAX_LENGTH}
          </span>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-[var(--color-civic-navy)]">
          Issue Tags (optional)
        </legend>
        <div className="flex flex-wrap gap-2" data-testid="issue-tag-selector" role="group">
          {ISSUE_TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={selectedTags.includes(tag)}
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
      </fieldset>

      <div className="pt-4">
        <LoadingButton
          type="submit"
          loading={isSubmitting}
          loadingText="Saving..."
          className="btn-primary w-full sm:w-auto"
          data-testid="submit-template-button"
          disabled={
            (turnstileSiteKey && !turnstileToken) ||
            title.trim().length < TITLE_MIN_LENGTH ||
            body.trim().length < BODY_MIN_LENGTH
          }
        >
          {submitLabel}
        </LoadingButton>
      </div>

      {turnstileSiteKey && <div ref={turnstileRef} data-testid="turnstile-widget" />}
    </form>
  );
}
