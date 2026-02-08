export const DISTRICT_PATTERN = /^(\d{1,2}|AL)$/;

export interface SavedDistrict {
  state: string;
  district: string;
}

export function formatDistrictDisplay(state: string, district: string): string {
  if (district === "AL" || district === "0" || district === "00") {
    return `${state} At-Large`;
  }
  return `${state}-${district}`;
}

export function isValidSavedDistrict(value: unknown): value is SavedDistrict {
  return (
    typeof value === "object" &&
    value !== null &&
    "state" in value &&
    "district" in value &&
    typeof (value as SavedDistrict).state === "string" &&
    typeof (value as SavedDistrict).district === "string"
  );
}
