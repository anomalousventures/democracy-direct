import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({ open: false });

function useDialogContext() {
  return useContext(DialogContext);
}

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange?.(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onOpenChange?.(false);
      }
    },
    [onOpenChange]
  );

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      open
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 m-auto p-0 bg-transparent backdrop:bg-black/80 backdrop:animate-in backdrop:fade-in-0 open:animate-in open:fade-in-0 open:zoom-in-95"
    >
      <div
        className={cn(
          "relative w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Icon name="x" className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </dialog>,
    document.body
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  );
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
