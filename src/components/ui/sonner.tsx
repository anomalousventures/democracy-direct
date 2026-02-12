import { useEffect, useState, useCallback } from "react";
import { useStore } from "@nanostores/preact";
import { Icon } from "@/components/icons";
import { $toasts, removeToast, type ToastData } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  success: "circle-check",
  info: "info",
  error: "octagon-x",
  default: "info",
} as const;

interface ToasterProps {
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  duration?: number;
}

function Toaster({ position = "top-right", duration: defaultDuration = 5000 }: ToasterProps) {
  const toasts = useStore($toasts);

  const positionClasses: Record<string, string> = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={cn(
        "fixed z-[100] flex flex-col gap-2 pointer-events-none",
        positionClasses[position]
      )}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} defaultDuration={defaultDuration} />
      ))}
    </div>
  );
}

function ToastItem({ toast, defaultDuration }: { toast: ToastData; defaultDuration: number }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => removeToast(toast.id), 200);
  }, [toast.id]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const ms = toast.duration ?? defaultDuration;
    const timer = setTimeout(dismiss, ms);
    return () => clearTimeout(timer);
  }, [toast.duration, defaultDuration, dismiss]);

  const iconName = ICON_MAP[toast.type];

  const borderColor: Record<string, string> = {
    success: "border-l-green-500",
    error: "border-l-red-500",
    info: "border-l-blue-500",
    default: "border-l-border",
  };

  const iconColor: Record<string, string> = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
    default: "text-muted-foreground",
  };

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto w-auto max-w-[90vw] rounded-md border border-border bg-background shadow-lg transition-all duration-200 border-l-4",
        borderColor[toast.type],
        visible && !exiting ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon name={iconName} className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor[toast.type])} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{toast.message}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick();
                dismiss();
              }}
              className="mt-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Icon name="x" className="h-3.5 w-3.5" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

export { Toaster };
