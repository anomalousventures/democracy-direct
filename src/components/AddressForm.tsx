import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { type Address, createEmptyAddress } from "../types/representative";
import { getItem, setItem, removeItem, getJSON, setJSON } from "@/lib/local-storage";

interface AddressFormProps {
  onChange: (address: Address) => void;
}

const STORAGE_KEY = "democracy-direct-address";
const SAVE_PREF_KEY = "democracy-direct-save-address";

function getSavePreference(): boolean {
  return getItem(SAVE_PREF_KEY) === "true";
}

function setSavePreference(save: boolean): void {
  if (save) {
    setItem(SAVE_PREF_KEY, "true");
  } else {
    removeItem(SAVE_PREF_KEY);
    removeItem(STORAGE_KEY);
  }
}

function loadFromLocalStorage(): Address | null {
  if (!getSavePreference()) return null;
  return getJSON<Address>(STORAGE_KEY);
}

function saveToLocalStorage(address: Address): void {
  if (getSavePreference()) {
    setJSON(STORAGE_KEY, address);
  }
}

function clearFromLocalStorage(): void {
  removeItem(STORAGE_KEY);
}

export function AddressForm({ onChange }: AddressFormProps) {
  const [address, setAddress] = useState<Address>(createEmptyAddress);
  const [saveEnabled, setSaveEnabled] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const prefEnabled = getSavePreference();
    setSaveEnabled(prefEnabled);
    if (prefEnabled) {
      const saved = loadFromLocalStorage();
      if (saved) {
        setAddress(saved);
        onChangeRef.current(saved);
      }
    }
  }, []);

  const handleChange = useCallback(
    (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newAddress = {
        ...address,
        [field]: e.target.value,
      };
      setAddress(newAddress);
      saveToLocalStorage(newAddress);
      onChange(newAddress);
    },
    [address, onChange]
  );

  const handleSaveToggle = useCallback(
    (checked: boolean) => {
      setSaveEnabled(checked);
      setSavePreference(checked);
      if (checked) {
        saveToLocalStorage(address);
      }
    },
    [address]
  );

  const handleClear = useCallback(() => {
    const empty = createEmptyAddress();
    setAddress(empty);
    clearFromLocalStorage();
    onChange(empty);
  }, [onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Your Return Address</h3>
        <Button variant="link" size="sm" onClick={handleClear} className="text-muted-foreground">
          Clear
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="address-name" className="text-primary">
            Your Name
          </Label>
          <Input
            id="address-name"
            name="name"
            autoComplete="name"
            type="text"
            value={address.name}
            onChange={handleChange("name")}
            variant="civic"
            className="mt-1"
            placeholder="Your full name"
          />
        </div>

        <div>
          <Label htmlFor="address-street" className="text-primary">
            Street Address
          </Label>
          <Input
            id="address-street"
            name="street-address"
            autoComplete="street-address"
            type="text"
            value={address.street}
            onChange={handleChange("street")}
            variant="civic"
            className="mt-1"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="address-city" className="text-primary">
              City
            </Label>
            <Input
              id="address-city"
              name="city"
              autoComplete="address-level2"
              type="text"
              value={address.city}
              onChange={handleChange("city")}
              variant="civic"
              className="mt-1"
              placeholder="City"
            />
          </div>
          <div>
            <Label htmlFor="address-state" className="text-primary">
              State
            </Label>
            <Input
              id="address-state"
              name="state"
              autoComplete="address-level1"
              type="text"
              value={address.state}
              onChange={handleChange("state")}
              variant="civic"
              className="mt-1"
              placeholder="CA"
              maxLength={2}
            />
          </div>
          <div>
            <Label htmlFor="address-zip" className="text-primary">
              ZIP
            </Label>
            <Input
              id="address-zip"
              name="postal-code"
              autoComplete="postal-code"
              type="text"
              value={address.zip}
              onChange={handleChange("zip")}
              variant="civic"
              className="mt-1"
              placeholder="12345"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-start gap-3">
          <Checkbox
            id="save-address"
            checked={saveEnabled}
            onCheckedChange={handleSaveToggle}
            className="mt-1"
          />
          <div className="text-sm">
            <Label htmlFor="save-address" className="font-medium text-primary cursor-pointer">
              Remember my address on this device
            </Label>
            <p className="text-muted-foreground mt-1">
              Your address will be stored only on this device/browser. It won't sync to other
              devices and is never sent to or stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { type Address };
