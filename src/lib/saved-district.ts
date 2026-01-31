const STORAGE_KEY = "democracy-direct-district";

export interface SavedDistrict {
  state: string;
  district: string;
}

export function getSavedDistrict(): SavedDistrict | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "state" in parsed &&
      "district" in parsed &&
      typeof (parsed as SavedDistrict).state === "string" &&
      typeof (parsed as SavedDistrict).district === "string"
    ) {
      return parsed as SavedDistrict;
    }
    return null;
  } catch {
    return null;
  }
}

export function setSavedDistrict(state: string, district: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    const data: SavedDistrict = {
      state: state.toUpperCase(),
      district: district.toUpperCase(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be full or disabled
  }
}

export function clearSavedDistrict(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export function formatDistrictDisplay(state: string, district: string): string {
  if (district === "AL" || district === "0" || district === "00") {
    return `${state} At-Large`;
  }
  return `${state}-${district}`;
}
