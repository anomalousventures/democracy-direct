import { atom, computed } from "nanostores";
import type { MeApiResponse } from "@/pages/api/me";

export const $user = atom<MeApiResponse>(null);
export const $isLoading = atom(true);
export const $isLoggedIn = computed($user, (user) => !!user);

let fetchPromise: Promise<void> | null = null;

export async function fetchUser(): Promise<void> {
  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    $isLoading.set(true);
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = (await res.json()) as MeApiResponse;
        $user.set(data);
      } else {
        $user.set(null);
      }
    } catch {
      $user.set(null);
    } finally {
      $isLoading.set(false);
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function clearUser(): void {
  $user.set(null);
  $isLoading.set(false);
}

if (typeof window !== "undefined") {
  fetchUser();
}
