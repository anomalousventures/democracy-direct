import { atom } from "nanostores";

export interface ToastData {
  id: string;
  message: string;
  type: "default" | "success" | "error" | "info";
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

export const $toasts = atom<ToastData[]>([]);

let nextId = 0;

function addToast(data: Omit<ToastData, "id">): string {
  const id = String(++nextId);
  $toasts.set([...$toasts.get(), { ...data, id }]);
  return id;
}

export function removeToast(id: string) {
  $toasts.set($toasts.get().filter((t) => t.id !== id));
}

interface ToastOptions {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

function toast(message: string, options?: ToastOptions): string {
  return addToast({ message, type: "default", ...options });
}

toast.success = (message: string, options?: ToastOptions): string =>
  addToast({ message, type: "success", ...options });

toast.error = (message: string, options?: ToastOptions): string =>
  addToast({ message, type: "error", ...options });

toast.info = (message: string, options?: ToastOptions): string =>
  addToast({ message, type: "info", ...options });

export { toast };
