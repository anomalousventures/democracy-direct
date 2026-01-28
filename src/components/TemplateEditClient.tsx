import { useState, useCallback } from "react";
import { TemplateForm } from "./TemplateForm";

interface TemplateEditClientProps {
  slug: string;
  initialData: {
    title: string;
    body: string;
    issueTags: string[];
  };
}

export function TemplateEditClient({ slug, initialData }: TemplateEditClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (data: { title: string; body: string; issueTags: string[] }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/templates/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update template");
        }

        setSuccess(true);
        setTimeout(() => {
          window.location.href = `/templates/mine`;
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [slug]
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
        <h2 className="text-xl font-semibold mb-2">Template Updated!</h2>
        <p className="text-muted-foreground">Your changes have been saved. Redirecting...</p>
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
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
