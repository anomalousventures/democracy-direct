import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

interface DropdownMenuProps {
  children: ReactNode;
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ReactNode;
}

function DropdownMenuTrigger({ asChild, children, onClick, ...props }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useContext(DropdownMenuContext);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(!open);
      onClick?.(e);
    },
    [open, setOpen, onClick]
  );

  if (asChild && isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    return cloneElement(children, {
      ref: triggerRef,
      "aria-expanded": open,
      "aria-haspopup": "menu",
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        handleClick(e);
        if (typeof childProps.onClick === "function") {
          (childProps.onClick as (e: React.MouseEvent) => void)(e);
        }
      },
      ...props,
    } as Record<string, unknown>);
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
  children: ReactNode;
}

function DropdownMenuContent({
  className,
  align = "center",
  sideOffset = 4,
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useContext(DropdownMenuContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const recalcPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const top = rect.bottom + sideOffset + window.scrollY;
    let left: number;

    if (align === "end") {
      left = rect.right + window.scrollX;
    } else if (align === "start") {
      left = rect.left + window.scrollX;
    } else {
      left = rect.left + rect.width / 2 + window.scrollX;
    }

    setPosition({ top, left });
  }, [align, sideOffset, triggerRef]);

  useEffect(() => {
    if (!open) return;

    recalcPosition();

    window.addEventListener("scroll", recalcPosition, true);
    window.addEventListener("resize", recalcPosition);
    return () => {
      window.removeEventListener("scroll", recalcPosition, true);
      window.removeEventListener("resize", recalcPosition);
    };
  }, [open, recalcPosition]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen, triggerRef]);

  useEffect(() => {
    if (!open || !contentRef.current) return;

    const items = contentRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (items.length > 0) items[0].focus();
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items?.length) return;

    const current = Array.from(items).findIndex((item) => item === document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = current < items.length - 1 ? current + 1 : 0;
      items[next].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = current > 0 ? current - 1 : items.length - 1;
      items[prev].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  }, []);

  if (!open || typeof document === "undefined") return null;

  const alignStyle: React.CSSProperties = {
    position: "absolute",
    top: position.top,
    ...(align === "end"
      ? { right: `calc(100vw - ${position.left}px)`, left: "auto" }
      : align === "start"
        ? { left: position.left }
        : { left: position.left, transform: "translateX(-50%)" }),
    zIndex: 50,
  };

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      style={alignStyle}
      onKeyDown={handleKeyDown}
      className={cn(
        "min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

function DropdownMenuItem({
  className,
  asChild,
  disabled,
  children,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useContext(DropdownMenuContext);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      (onClick as React.MouseEventHandler<HTMLElement>)?.(e);
      setOpen(false);
    },
    [disabled, onClick, setOpen]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      (e.target as HTMLElement).click();
    }
  }, []);

  const itemClassName = cn(
    "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
    disabled && "pointer-events-none opacity-50",
    className
  );

  if (asChild) {
    const child = Children.only(children);
    if (isValidElement(child)) {
      const childProps = child.props as Record<string, unknown>;
      return cloneElement(child, {
        role: "menuitem",
        tabIndex: disabled ? -1 : 0,
        className: cn(itemClassName, childProps.className as string),
        onClick: (e: React.MouseEvent) => {
          handleClick(e as React.MouseEvent<HTMLElement>);
          if (typeof childProps.onClick === "function") {
            (childProps.onClick as (e: React.MouseEvent) => void)(e);
          }
        },
        onKeyDown: handleKeyDown,
        ...props,
      } as Record<string, unknown>);
    }
  }

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      className={itemClassName}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
