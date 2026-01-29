/**
 * Safe localStorage helpers with error handling for:
 * - Private browsing mode (storage unavailable)
 * - Quota exceeded
 * - Invalid JSON
 */

export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getJSON<T>(key: string): T | null {
  const value = getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setJSON<T>(key: string, value: T): boolean {
  try {
    return setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
