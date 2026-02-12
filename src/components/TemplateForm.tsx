import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { Toggle } from "@/components/ui/toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TiptapEditor } from "./TiptapEditor";
import { MarkdownContent } from "./MarkdownContent";
import { BillPicker } from "./BillPicker";
import { detectBillNumbers } from "@/lib/bill-detection";
import { useDebounce } from "@/hooks/useDebounce";
import {
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  BODY_MIN_LENGTH,
  BODY_MAX_LENGTH,
  validateTemplateVariables,
  getSupportedVariablesList,
} from "@/lib/template-validation";
import { formatDateMedium } from "@/lib/date-utils";

const SAMPLE_PREVIEW_DATA = {
  REP_NAME: "Jane Smith",
  REP_TITLE: "Senator",
  REP_FIRST: "Jane",
  REP_LAST: "Smith",
  REP_PARTY: "Independent",
  STATE: "CA",
  DISTRICT: "12",
  USER_NAME: "John Doe",
  USER_CITY: "San Francisco",
  TODAY_DATE: formatDateMedium(new Date()),
};

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

interface TemplateFormProps {
  initialData?: {
    title: string;
    description?: string;
    body: string;
    issueTags: string[];
    linkedBillNumbers?: string[];
    isPublic?: boolean;
  };
  availableTags: string[];
  onSubmit: (data: {
    title: string;
    description?: string;
    body: string;
    issueTags: string[];
    linkedBillNumbers: string[];
    turnstileToken?: string;
    isPublic?: boolean;
  }) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  turnstileSiteKey?: string;
  isAuthenticated?: boolean;
}

export function TemplateForm({
  initialData,
  availableTags,
  onSubmit,
  submitLabel = "Create Template",
  isSubmitting = false,
  turnstileSiteKey,
  isAuthenticated = false,
}: TemplateFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    (initialData?.issueTags || []).map((t) => t.toLowerCase())
  );
  const [linkedBillNumbers, setLinkedBillNumbers] = useState<string[]>(
    initialData?.linkedBillNumbers ?? []
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const suggestedBillsRef = useRef<Set<string>>(new Set(initialData?.linkedBillNumbers ?? []));

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

  const debouncedBody = useDebounce(body, 1000);

  const prevLinkedRef = useRef<Set<string>>(new Set(linkedBillNumbers));

  useEffect(() => {
    const current = new Set(linkedBillNumbers);
    const previous = prevLinkedRef.current;
    for (const bill of previous) {
      if (!current.has(bill)) {
        suggestedBillsRef.current.delete(bill);
      }
    }
    prevLinkedRef.current = current;
  }, [linkedBillNumbers]);

  useEffect(() => {
    if (!debouncedBody.trim()) return;
    const detected = detectBillNumbers(debouncedBody);
    const unlinked = detected.filter(
      (b) => !linkedBillNumbers.includes(b) && !suggestedBillsRef.current.has(b)
    );
    if (unlinked.length === 0) return;

    for (const b of unlinked) {
      suggestedBillsRef.current.add(b);
    }

    const billList = unlinked.join(", ");
    toast(`Found ${billList} in your letter`, {
      action: {
        label: "Link",
        onClick: () => {
          setLinkedBillNumbers((prev) => [...new Set([...prev, ...unlinked])]);
        },
      },
      duration: 8000,
    });
  }, [debouncedBody, linkedBillNumbers]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const previewContent = useMemo(() => {
    let preview = body;
    for (const [key, value] of Object.entries(SAMPLE_PREVIEW_DATA)) {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return preview;
  }, [body]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < TITLE_MIN_LENGTH) {
      newErrors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters`;
    } else if (title.trim().length > TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters`;
    }

    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`;
    }

    if (!body.trim()) {
      newErrors.body = "Body is required";
    } else if (body.trim().length < BODY_MIN_LENGTH) {
      newErrors.body = `Body must be at least ${BODY_MIN_LENGTH} characters`;
    } else if (body.trim().length > BODY_MAX_LENGTH) {
      newErrors.body = `Body must be at most ${BODY_MAX_LENGTH} characters`;
    } else {
      const variableValidation = validateTemplateVariables(body);
      if (!variableValidation.valid) {
        const unknownList = variableValidation.unknownVariables.join(", ");
        const supportedList = getSupportedVariablesList().join(", ");
        newErrors.body = `Unknown variable(s): ${unknownList}. Supported variables: ${supportedList}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, body]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;
      if (turnstileSiteKey && !turnstileToken) return;

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        body: body.trim(),
        issueTags: selectedTags,
        linkedBillNumbers,
        turnstileToken: turnstileToken ?? undefined,
        isPublic: isAuthenticated ? isPublic : true,
      });
    },
    [
      title,
      description,
      body,
      selectedTags,
      linkedBillNumbers,
      onSubmit,
      validate,
      turnstileSiteKey,
      turnstileToken,
      isAuthenticated,
      isPublic,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-primary">
          Title
        </Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your template a descriptive title"
          variant="civic"
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
        <Label htmlFor="description" className="text-primary">
          Short Description (optional)
        </Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary for search results and sharing..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          data-testid="template-description-input"
          maxLength={DESCRIPTION_MAX_LENGTH}
          aria-invalid={errors.description ? "true" : undefined}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {errors.description && (
              <span id="description-error" className="text-red-500">
                {errors.description}
              </span>
            )}
          </span>
          <span>
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template-body" className="text-primary">
          Letter Body
        </Label>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">
            <TiptapEditor
              id="template-body"
              content={body}
              onChange={setBody}
              placeholder="Write your letter template here..."
              maxLength={BODY_MAX_LENGTH}
              aria-invalid={errors.body ? "true" : undefined}
              aria-describedby={errors.body ? "body-error" : "body-hint"}
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="min-h-[200px] p-4 bg-white border-2 border-border rounded-md">
              {body ? (
                <MarkdownContent content={previewContent} className="text-sm" />
              ) : (
                <p className="text-muted-foreground italic">
                  Start writing your letter to see a preview...
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground border-t pt-3">
                Sample data: Senator Jane Smith (Independent, CA-12)
              </p>
            </div>
          </TabsContent>
        </Tabs>
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
        <legend className="block text-sm font-medium text-primary">Issue Tags (optional)</legend>
        <div className="flex flex-wrap gap-2" data-testid="issue-tag-selector">
          {availableTags.map((tag) => (
            <Toggle
              key={tag}
              variant="outline"
              size="sm"
              pressed={selectedTags.includes(tag)}
              onPressedChange={() => toggleTag(tag)}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground capitalize"
            >
              {tag}
            </Toggle>
          ))}
        </div>
      </fieldset>

      <BillPicker selectedBills={linkedBillNumbers} onBillsChange={setLinkedBillNumbers} />

      {isAuthenticated && (
        <div className="flex items-start space-x-3">
          <Checkbox
            id="isPublic"
            checked={isPublic}
            onCheckedChange={(checked) => setIsPublic(checked === true)}
            data-testid="is-public-checkbox"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="isPublic"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Share publicly
            </Label>
            <p className="text-sm text-muted-foreground">
              {isPublic
                ? "This template will be visible to everyone after approval."
                : "This template will only be visible to you."}
            </p>
          </div>
        </div>
      )}

      <div className="pt-4">
        <LoadingButton
          type="submit"
          variant="civic"
          loading={isSubmitting}
          loadingText="Saving..."
          className="w-full sm:w-auto"
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
