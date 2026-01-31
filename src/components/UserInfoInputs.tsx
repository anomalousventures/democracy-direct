import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getItem, setItem, removeItem, getJSON, setJSON } from "@/lib/local-storage";

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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const savedPref = getItem(SAVE_PREF_KEY);
    if (savedPref === "true") {
      setSaveEnabled(true);
      const saved = getJSON<UserInfo>(STORAGE_KEY);
      if (saved) {
        setName(saved.name || "");
        setCity(saved.city || "");
      }
    }
  }, []);

  useEffect(() => {
    onChangeRef.current({ name, city });
    if (saveEnabled) {
      setJSON(STORAGE_KEY, { name, city });
    }
  }, [name, city, saveEnabled]);

  const handleSaveToggle = useCallback((checked: boolean) => {
    setSaveEnabled(checked);
    setItem(SAVE_PREF_KEY, String(checked));
    if (!checked) {
      removeItem(STORAGE_KEY);
    }
  }, []);

  if (!showName && !showCity) {
    return null;
  }

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-md p-4 space-y-3">
      <div className="text-sm font-medium text-primary">
        Your Information
        <span className="font-normal text-muted-foreground ml-2">
          (used to fill template variables)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {showName && (
          <div>
            <Label htmlFor="user-name" className="text-xs text-muted-foreground">
              Your Name
            </Label>
            <Input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              variant="civic"
              className="mt-1"
              autoComplete="name"
              name="name"
            />
          </div>
        )}
        {showCity && (
          <div>
            <Label htmlFor="user-city" className="text-xs text-muted-foreground">
              Your City
            </Label>
            <Input
              id="user-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              variant="civic"
              className="mt-1"
              autoComplete="address-level2"
              name="city"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="save-user-info" checked={saveEnabled} onCheckedChange={handleSaveToggle} />
        <Label
          htmlFor="save-user-info"
          className="text-xs text-[var(--color-muted-foreground)] cursor-pointer"
        >
          Remember on this device
        </Label>
      </div>
    </div>
  );
}
