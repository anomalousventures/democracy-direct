import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { type Address, createEmptyAddress } from "@/types/representative";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDebounce } from "@/hooks/useDebounce";

export interface SenderInfo extends Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export function createEmptySenderInfo(): SenderInfo {
  return createEmptyAddress();
}

interface SenderInfoFormProps {
  onChange: (info: SenderInfo) => void;
  requiredForTemplate?: {
    name: boolean;
    city: boolean;
  };
}

export function SenderInfoForm({
  onChange,
  requiredForTemplate = { name: false, city: false },
}: SenderInfoFormProps) {
  const [senderInfo, setSenderInfo] = useState<SenderInfo>(createEmptySenderInfo);
  const [saveEnabled, setSaveEnabled] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const senderInfoStorage = useLocalStorage<SenderInfo>("SENDER_INFO");
  const savePrefStorage = useLocalStorage<boolean>("SAVE_SENDER_PREF");
  const debouncedSenderInfo = useDebounce(senderInfo, 400);

  useEffect(() => {
    if (!senderInfoStorage.isReady || hasLoaded) return;

    const loadSavedData = async () => {
      try {
        const savedPref = await savePrefStorage.get();
        if (savedPref === true) {
          setSaveEnabled(true);
          const saved = await senderInfoStorage.get();
          if (saved) {
            setSenderInfo(saved);
            onChangeRef.current(saved);
          }
        }
      } finally {
        setHasLoaded(true);
      }
    };

    loadSavedData();
  }, [senderInfoStorage.isReady, hasLoaded, senderInfoStorage, savePrefStorage]);

  useEffect(() => {
    if (!hasLoaded || !saveEnabled) return;

    senderInfoStorage.set(debouncedSenderInfo);
  }, [debouncedSenderInfo, saveEnabled, hasLoaded, senderInfoStorage]);

  const handleChange = useCallback(
    (field: keyof SenderInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newInfo = {
        ...senderInfo,
        [field]: e.target.value,
      };
      setSenderInfo(newInfo);
      onChange(newInfo);
    },
    [senderInfo, onChange]
  );

  const handleSaveToggle = useCallback(
    (checked: boolean) => {
      setSaveEnabled(checked);
      void savePrefStorage
        .set(checked)
        .catch((err) => console.error("Failed to save preference:", err));
      if (!checked) {
        void senderInfoStorage.remove();
      } else {
        void senderInfoStorage
          .set(senderInfo)
          .catch((err) => console.error("Failed to save sender info:", err));
      }
    },
    [senderInfo, savePrefStorage, senderInfoStorage]
  );

  const handleClear = useCallback(() => {
    const empty = createEmptySenderInfo();
    setSenderInfo(empty);
    void senderInfoStorage.remove();
    onChange(empty);
  }, [onChange, senderInfoStorage]);

  const requiredHint = (field: "name" | "city") =>
    requiredForTemplate[field] ? <span className="text-destructive ml-0.5">*</span> : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Your Information</h3>
        <Button
          variant="link"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground text-xs h-auto p-0"
        >
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="sender-name" className="text-xs text-muted-foreground">
            Your Name{requiredHint("name")}
          </Label>
          <Input
            id="sender-name"
            name="name"
            autoComplete="name"
            type="text"
            value={senderInfo.name}
            onChange={handleChange("name")}
            className="mt-1 h-9"
            placeholder="Your name"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="sender-street" className="text-xs text-muted-foreground">
            Street Address
          </Label>
          <Input
            id="sender-street"
            name="street-address"
            autoComplete="street-address"
            type="text"
            value={senderInfo.street}
            onChange={handleChange("street")}
            className="mt-1 h-9"
            placeholder="123 Main St"
          />
        </div>

        <div>
          <Label htmlFor="sender-city" className="text-xs text-muted-foreground">
            City{requiredHint("city")}
          </Label>
          <Input
            id="sender-city"
            name="city"
            autoComplete="address-level2"
            type="text"
            value={senderInfo.city}
            onChange={handleChange("city")}
            className="mt-1 h-9"
            placeholder="City"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="sender-state" className="text-xs text-muted-foreground">
              State
            </Label>
            <Input
              id="sender-state"
              name="state"
              autoComplete="address-level1"
              type="text"
              value={senderInfo.state}
              onChange={handleChange("state")}
              className="mt-1 h-9"
              placeholder="CA"
              maxLength={2}
            />
          </div>
          <div>
            <Label htmlFor="sender-zip" className="text-xs text-muted-foreground">
              ZIP
            </Label>
            <Input
              id="sender-zip"
              name="postal-code"
              autoComplete="postal-code"
              type="text"
              value={senderInfo.zip}
              onChange={handleChange("zip")}
              className="mt-1 h-9"
              placeholder="12345"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {(requiredForTemplate.name || requiredForTemplate.city) && (
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> Required for this template
        </p>
      )}

      <div className="flex items-center gap-2">
        <Checkbox id="save-sender-info" checked={saveEnabled} onCheckedChange={handleSaveToggle} />
        <Label htmlFor="save-sender-info" className="text-xs text-muted-foreground cursor-pointer">
          Remember on this device
        </Label>
      </div>
    </div>
  );
}
