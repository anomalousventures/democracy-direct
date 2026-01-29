import { useState, useEffect, useCallback } from "react";
import { Input } from "./ui/input";

const STORAGE_KEY = "democracy-direct-user-info";
const SAVE_PREF_KEY = "democracy-direct-save-user-info";

interface UserInfo {
  name: string;
  city: string;
}

interface UserInfoInputsProps {
  onChange: (info: UserInfo) => void;
  showName?: boolean;
  showCity?: boolean;
}

export function UserInfoInputs({
  onChange,
  showName = false,
  showCity = false,
}: UserInfoInputsProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saveEnabled, setSaveEnabled] = useState(false);

  useEffect(() => {
    const savedPref = localStorage.getItem(SAVE_PREF_KEY);
    if (savedPref === "true") {
      setSaveEnabled(true);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setName(parsed.name || "");
          setCity(parsed.city || "");
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    onChange({ name, city });
    if (saveEnabled) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, city }));
    }
  }, [name, city, saveEnabled, onChange]);

  const handleSaveToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSaveEnabled(checked);
    localStorage.setItem(SAVE_PREF_KEY, String(checked));
    if (!checked) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (!showName && !showCity) {
    return null;
  }

  return (
    <div className="bg-[var(--color-civic-gold)]/10 border border-[var(--color-civic-gold)]/30 rounded-md p-4 space-y-3">
      <div className="text-sm font-medium text-[var(--color-civic-navy)]">
        Your Information
        <span className="font-normal text-[var(--color-muted-foreground)] ml-2">
          (used to fill template variables)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {showName && (
          <div>
            <label
              htmlFor="user-name"
              className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1"
            >
              Your Name
            </label>
            <Input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="input-civic"
              autoComplete="name"
              name="name"
            />
          </div>
        )}
        {showCity && (
          <div>
            <label
              htmlFor="user-city"
              className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1"
            >
              Your City
            </label>
            <Input
              id="user-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className="input-civic"
              autoComplete="address-level2"
              name="city"
            />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] cursor-pointer">
        <input
          type="checkbox"
          checked={saveEnabled}
          onChange={handleSaveToggle}
          className="rounded border-[var(--color-border)] text-[var(--color-civic-navy)] focus:ring-[var(--color-civic-gold)]"
        />
        <span>Remember on this device</span>
      </label>
    </div>
  );
}
