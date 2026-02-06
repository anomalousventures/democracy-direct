import { useState, useCallback, useEffect } from "react";
import { Icon } from "@/components/icons";
import { formatDistrictDisplay, type SavedDistrict } from "@/lib/saved-district";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useMe } from "@/hooks/useMe";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface SaveDistrictPromptProps {
  state: string;
  district: string;
}

export function SaveDistrictPrompt({ state, district }: SaveDistrictPromptProps) {
  const { user, isLoggedIn, isLoading } = useMe();
  const districtStorage = useLocalStorage<SavedDistrict>("DISTRICT");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { capture } = useAnalytics();

  const displayText = formatDistrictDisplay(state, district);

  useEffect(() => {
    if (isLoading) return;

    const checkIfSaved = async () => {
      if (isLoggedIn && user?.savedState === state && user?.savedDistrict === district) {
        setIsSaved(true);
        return;
      }

      const saved = await districtStorage.get();
      if (saved?.state === state && saved?.district === district) {
        setIsSaved(true);
      }
    };

    checkIfSaved();
  }, [isLoading, isLoggedIn, user, state, district, districtStorage]);

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
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to save district");
        }
      }

      await districtStorage.set({
        state: state.toUpperCase(),
        district: district.toUpperCase(),
      });

      setIsSaved(true);
      capture("district_saved", {
        state,
        district,
        isLoggedIn,
        source: "reps_page",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save district");
    } finally {
      setIsSaving(false);
    }
  }, [state, district, isLoggedIn, capture, districtStorage]);

  if (isLoading) {
    return null;
  }

  if (isSaved) {
    return (
      <div
        className="p-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg shadow-md"
        data-testid="save-district-success"
      >
        <div className="flex items-center gap-3">
          <Icon name="check-circle" className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">District saved!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              {isLoggedIn
                ? `${displayText} has been saved to your account.`
                : `${displayText} has been saved for your next visit.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white border-l-4 border-accent rounded-r-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
            <Icon name="map-pin" className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-primary">Save {displayText} as your district?</p>
            <p className="text-sm text-muted-foreground mt-0.5">
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
          className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          data-testid="save-district-button"
        >
          <Icon name="bookmark" className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{isSaving ? "Saving..." : "Save District"}</span>
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-1" role="alert">
          <Icon name="triangle-alert" className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
