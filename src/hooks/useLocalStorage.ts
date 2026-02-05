import { useCallback } from "react";
import { useMe } from "@/hooks/useMe";
import { STORAGE_KEYS, type StorageKey } from "@/lib/storage-keys";
import { encrypt, decrypt, isEncryptedPayload } from "@/lib/storage-encryption";

function buildNamespacedKey(userId: string | undefined, key: string): string {
  return `dd:${userId ?? "anon"}:${key}`;
}

export function useLocalStorage<T>(key: StorageKey) {
  const { user, isLoading } = useMe();

  const namespacedKey = buildNamespacedKey(user?.id, STORAGE_KEYS[key]);

  const get = useCallback(async (): Promise<T | null> => {
    if (typeof window === "undefined") return null;

    try {
      const raw = localStorage.getItem(namespacedKey);
      if (!raw) return null;

      if (user?.emailHash && isEncryptedPayload(raw)) {
        const decrypted = await decrypt(raw, user.emailHash);
        return JSON.parse(decrypted) as T;
      }

      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [namespacedKey, user?.emailHash]);

  const set = useCallback(
    async (value: T): Promise<boolean> => {
      if (typeof window === "undefined") return false;

      try {
        const json = JSON.stringify(value);

        if (user?.emailHash) {
          const encrypted = await encrypt(json, user.emailHash);
          localStorage.setItem(namespacedKey, encrypted);
        } else {
          localStorage.setItem(namespacedKey, json);
        }
        return true;
      } catch {
        return false;
      }
    },
    [namespacedKey, user?.emailHash]
  );

  const remove = useCallback((): boolean => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.removeItem(namespacedKey);
      return true;
    } catch {
      return false;
    }
  }, [namespacedKey]);

  return { get, set, remove, isReady: !isLoading };
}

export function getNamespacedKey(userId: string | undefined, key: StorageKey): string {
  return buildNamespacedKey(userId, STORAGE_KEYS[key]);
}
