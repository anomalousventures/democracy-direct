export const STORAGE_KEYS = {
  DISTRICT: "district",
  SENDER_INFO: "sender-info",
  SAVE_SENDER_PREF: "save-sender-pref",
} as const;

export const LEGACY_KEYS = {
  DISTRICT: "democracy-direct-district",
  SENDER_INFO: "democracy-direct-sender-info",
  SAVE_SENDER_PREF: "democracy-direct-save-sender-info",
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
