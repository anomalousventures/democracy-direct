import { useState, useEffect, useCallback } from "react";
import {
  getSavedDistrict,
  clearSavedDistrict,
  formatDistrictDisplay,
  type SavedDistrict,
} from "@/lib/saved-district";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getStateName } from "@/lib/states";

interface SavedDistrictBannerProps {
  serverSavedState: string | null;
  serverSavedDistrict: string | null;
  isLoggedIn: boolean;
}

export function SavedDistrictBanner({
  serverSavedState,
  serverSavedDistrict,
  isLoggedIn,
}: SavedDistrictBannerProps) {
  const [localDistrict, setLocalDistrict] = useState<SavedDistrict | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const { capture } = useAnalytics();

  useEffect(() => {
    if (!isLoggedIn) {
      setLocalDistrict(getSavedDistrict());
    }
  }, [isLoggedIn]);

  const savedState = isLoggedIn ? serverSavedState : (localDistrict?.state ?? null);
  const savedDistrict = isLoggedIn ? serverSavedDistrict : (localDistrict?.district ?? null);

  const handleClear = useCallback(async () => {
    setIsClearing(true);

    try {
      if (isLoggedIn) {
        const response = await fetch("/api/user/district", {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to clear district");
        }
      } else {
        clearSavedDistrict();
        setLocalDistrict(null);
      }

      setIsCleared(true);
      capture("district_cleared", { isLoggedIn });
    } catch (err) {
      console.error("Failed to clear district:", err);
    } finally {
      setIsClearing(false);
    }
  }, [isLoggedIn, capture]);

  if (isCleared || !savedState || !savedDistrict) {
    return null;
  }

  const displayText = formatDistrictDisplay(savedState, savedDistrict);
  const stateName = getStateName(savedState);
  const repsUrl = `/reps/${savedState.toLowerCase()}/${savedDistrict.toLowerCase()}`;

  return (
    <div
      className="mb-6 p-4 bg-[var(--color-civic-navy)]/5 border border-[var(--color-civic-navy)]/20 rounded-md"
      data-testid="saved-district-banner"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[var(--color-civic-navy)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-[var(--color-civic-navy)]">
            Your saved district:{" "}
            <span className="font-semibold">
              {displayText} ({stateName})
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={repsUrl}
            className="btn-primary text-sm"
            data-testid="view-my-reps-button"
            onClick={() =>
              capture("view_saved_reps_clicked", { state: savedState, district: savedDistrict })
            }
          >
            View My Reps
          </a>
          <button
            type="button"
            onClick={handleClear}
            disabled={isClearing}
            className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-civic-navy)] underline disabled:opacity-50"
            data-testid="change-district-button"
          >
            {isClearing ? "Clearing..." : "Change"}
          </button>
        </div>
      </div>
    </div>
  );
}
