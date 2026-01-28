import { useState, useCallback } from "react";
import { toast } from "sonner";
import { TemplateForm } from "./TemplateForm";

interface TemplateCreateClientProps {
  turnstileSiteKey?: string;
}

export function TemplateCreateClient({ turnstileSiteKey }: TemplateCreateClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (data: { title: string; body: string; issueTags: string[]; turnstileToken?: string }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create template");
        }

        setSuccess(true);
        toast.success("Template created successfully!");
        setTimeout(() => {
          window.location.href = `/templates/mine`;
        }, 1500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 bg-green-100 flex items-center justify-center rounded-full">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Template Created!</h2>
        <p className="text-muted-foreground">
          Your template has been submitted for review. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      <TemplateForm
        onSubmit={handleSubmit}
        submitLabel="Create Template"
        isSubmitting={isSubmitting}
        turnstileSiteKey={turnstileSiteKey}
      />
    </div>
  );
}
