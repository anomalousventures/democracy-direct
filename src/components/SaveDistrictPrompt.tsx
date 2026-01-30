import { useState, useCallback } from "react";
import { setSavedDistrict, formatDistrictDisplay } from "@/lib/saved-district";
import { useAnalytics } from "@/hooks/useAnalytics";

interface SaveDistrictPromptProps {
  state: string;
  district: string;
  isLoggedIn: boolean;
}

export function SaveDistrictPrompt({ state, district, isLoggedIn }: SaveDistrictPromptProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { capture } = useAnalytics();

  const displayText = formatDistrictDisplay(state, district);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (isLoggedIn) {
        const response = await fetch("/api/user/district", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, district }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save district");
        }
      } else {
        setSavedDistrict(state, district);
      }

      setIsSaved(true);
      capture("district_saved", {
        state,
        district,
        isLoggedIn,
        source: "zip_lookup",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save district");
    } finally {
      setIsSaving(false);
    }
  }, [state, district, isLoggedIn, capture]);

  if (isSaved) {
    return (
      <div
        className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-green-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">District saved!</span>
        </div>
        <p className="mt-1 text-sm text-green-700">
          {isLoggedIn
            ? `Your district (${displayText}) has been saved to your account.`
            : `Your district (${displayText}) has been saved to this device.`}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-[var(--color-civic-gold)]/10 border border-[var(--color-civic-gold)]/30 rounded-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-medium text-[var(--color-civic-navy)]">Remember this district?</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {isLoggedIn
              ? "Save your district to your account for quick access next time."
              : "Save your district to this device for quick access next time."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary whitespace-nowrap disabled:opacity-50"
          data-testid="save-district-button"
        >
          {isSaving ? "Saving..." : `Save ${displayText}`}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
