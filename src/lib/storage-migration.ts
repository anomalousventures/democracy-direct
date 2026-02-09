import { STORAGE_KEYS, LEGACY_KEYS, type StorageKey } from "@/lib/storage-keys";
import { encrypt } from "@/lib/storage-encryption";

function buildNamespacedKey(userId: string, key: string): string {
  return `dd:${userId}:${key}`;
}

function buildAnonKey(key: string): string {
  return `dd:anon:${key}`;
}

export function hasLegacyData(): boolean {
  if (typeof window === "undefined") return false;

  return Object.values(LEGACY_KEYS).some((key) => localStorage.getItem(key) !== null);
}

export function hasAnonData(): boolean {
  if (typeof window === "undefined") return false;

  return Object.values(STORAGE_KEYS).some(
    (key) => localStorage.getItem(buildAnonKey(key)) !== null
  );
}

export async function migrateAnonymousData(userId: string, emailHash: string): Promise<void> {
  if (typeof window === "undefined") return;

  const legacyMappings: Array<{ legacy: string; key: StorageKey }> = [
    { legacy: LEGACY_KEYS.DISTRICT, key: "DISTRICT" },
    { legacy: LEGACY_KEYS.SENDER_INFO, key: "SENDER_INFO" },
    { legacy: LEGACY_KEYS.SAVE_SENDER_PREF, key: "SAVE_SENDER_PREF" },
  ];

  for (const { legacy, key } of legacyMappings) {
    const value = localStorage.getItem(legacy);
    if (value) {
      try {
        const encrypted = await encrypt(value, emailHash);
        localStorage.setItem(buildNamespacedKey(userId, STORAGE_KEYS[key]), encrypted);
        localStorage.removeItem(legacy);
      } catch (e) {
        console.warn("[storage-migration] legacy key failed:", key, e);
      }
    }
  }

  const anonMappings: StorageKey[] = ["DISTRICT", "SENDER_INFO", "SAVE_SENDER_PREF"];

  for (const key of anonMappings) {
    const anonKey = buildAnonKey(STORAGE_KEYS[key]);
    const value = localStorage.getItem(anonKey);
    if (value) {
      try {
        const encrypted = await encrypt(value, emailHash);
        localStorage.setItem(buildNamespacedKey(userId, STORAGE_KEYS[key]), encrypted);
        localStorage.removeItem(anonKey);
      } catch (e) {
        console.warn("[storage-migration] anon key failed:", key, e);
      }
    }
  }
}

export function clearLegacyData(): void {
  if (typeof window === "undefined") return;

  Object.values(LEGACY_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
