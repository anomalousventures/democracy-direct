import { useState, useCallback, useEffect, useRef } from "react";
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const enabled = e.target.checked;
      setSaveEnabled(enabled);
      setSavePreference(enabled);
      if (enabled) {
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
        <h3 className="text-lg font-semibold text-[var(--color-civic-navy)]">
          Your Return Address
        </h3>
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-civic-navy)] underline"
        >
          Clear
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="address-name"
            className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
          >
            Your Name
          </label>
          <input
            id="address-name"
            name="name"
            autoComplete="name"
            type="text"
            value={address.name}
            onChange={handleChange("name")}
            className="input-civic"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label
            htmlFor="address-street"
            className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
          >
            Street Address
          </label>
          <input
            id="address-street"
            name="street-address"
            autoComplete="street-address"
            type="text"
            value={address.street}
            onChange={handleChange("street")}
            className="input-civic"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label
              htmlFor="address-city"
              className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
            >
              City
            </label>
            <input
              id="address-city"
              name="city"
              autoComplete="address-level2"
              type="text"
              value={address.city}
              onChange={handleChange("city")}
              className="input-civic"
              placeholder="City"
            />
          </div>
          <div>
            <label
              htmlFor="address-state"
              className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
            >
              State
            </label>
            <input
              id="address-state"
              name="state"
              autoComplete="address-level1"
              type="text"
              value={address.state}
              onChange={handleChange("state")}
              className="input-civic"
              placeholder="CA"
              maxLength={2}
            />
          </div>
          <div>
            <label
              htmlFor="address-zip"
              className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
            >
              ZIP
            </label>
            <input
              id="address-zip"
              name="postal-code"
              autoComplete="postal-code"
              type="text"
              value={address.zip}
              onChange={handleChange("zip")}
              className="input-civic"
              placeholder="12345"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--color-border)]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveEnabled}
            onChange={handleSaveToggle}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-civic-navy)] focus:ring-[var(--color-civic-navy)]"
          />
          <div className="text-sm">
            <span className="font-medium text-[var(--color-civic-navy)]">
              Remember my address on this device
            </span>
            <p className="text-[var(--color-muted-foreground)] mt-1">
              Your address will be stored only on this device/browser. It won't sync to other
              devices and is never sent to or stored on our servers.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export { type Address };
