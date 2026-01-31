import { useState, useCallback } from "react";
import { Bookmark, Check, MapPin } from "lucide-react";
import { setSavedDistrict, formatDistrictDisplay } from "@/lib/saved-district";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getStateName } from "@/lib/states";

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
  const stateName = getStateName(state);

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
        className="p-5 bg-green-50 border-l-4 border-green-500 rounded-r-lg shadow-sm"
        role="status"
        aria-live="polite"
        data-testid="save-district-success"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">District saved!</p>
            <p className="text-sm text-green-700">
              {isLoggedIn
                ? `${displayText} (${stateName}) has been saved to your account.`
                : `${displayText} (${stateName}) has been saved to this device.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white border-l-4 border-[var(--color-civic-gold)] rounded-r-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-civic-gold)]/20 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[var(--color-civic-gold)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-civic-navy)]">
              Save {displayText} as your district?
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
              {isLoggedIn
                ? "Quick access to your representatives from any device."
                : "Quick access to your representatives next time you visit."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-civic-navy)] text-white font-medium rounded-md hover:bg-[var(--color-civic-navy)]/90 disabled:opacity-50 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-navy)]/50 focus:ring-offset-2"
          data-testid="save-district-button"
        >
          <Bookmark className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{isSaving ? "Saving..." : "Save District"}</span>
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
