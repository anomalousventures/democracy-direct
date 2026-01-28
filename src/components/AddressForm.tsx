import { useState, useCallback, useEffect } from "react";
import { type Address, createEmptyAddress } from "../types/representative";

interface AddressFormProps {
  onChange: (address: Address) => void;
}

const STORAGE_KEY = "democracy-direct-address";

function loadFromLocalStorage(): Address {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors, return empty address
  }
  return createEmptyAddress();
}

function saveToLocalStorage(address: Address): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
  } catch {
    // Ignore storage errors
  }
}

function clearFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function AddressForm({ onChange }: AddressFormProps) {
  const [address, setAddress] = useState<Address>(createEmptyAddress);

  useEffect(() => {
    const saved = loadFromLocalStorage();
    setAddress(saved);
    onChange(saved);
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

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Your address is saved locally in your browser and never sent to our servers.
      </p>
    </div>
  );
}

export { type Address };
