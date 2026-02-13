import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface OTPContextValue {
  slots: Array<{ char: string; isActive: boolean; hasFakeCaret: boolean }>;
}

const OTPContext = createContext<OTPContextValue>({ slots: [] });

interface InputOTPProps {
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  containerClassName?: string;
  id?: string;
  children: ReactNode;
}

function InputOTP({
  maxLength,
  value,
  onChange,
  disabled,
  autoComplete,
  containerClassName,
  id,
  children,
}: InputOTPProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const slots = Array.from({ length: maxLength }, (_, i) => ({
    char: value[i] ?? "",
    isActive: focused && i === Math.min(value.length, maxLength - 1),
    hasFakeCaret: focused && i === value.length && value.length < maxLength,
  }));

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/\D/g, "").slice(0, maxLength);
      onChange(newValue);
    },
    [maxLength, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value) {
        e.preventDefault();
      }
    },
    [value]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (focused && inputRef.current) {
      inputRef.current.setSelectionRange(value.length, value.length);
    }
  }, [focused, value.length]);

  return (
    <OTPContext.Provider value={{ slots }}>
      <div
        className={cn("flex items-center gap-3 has-[:disabled]:opacity-50", containerClassName)}
        onClick={focusInput}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={autoComplete}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          maxLength={maxLength}
          className="sr-only absolute"
        />
        {children}
      </div>
    </OTPContext.Provider>
  );
}

function InputOTPGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
}

function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const { slots } = useContext(OTPContext);
  const slot = slots[index];
  if (!slot) return null;

  const { char, isActive, hasFakeCaret } = slot;

  return (
    <div
      className={cn(
        "relative flex h-14 w-12 items-center justify-center rounded-md border-2 border-border bg-white text-2xl font-semibold text-primary shadow-sm transition-all duration-200",
        "hover:border-primary/40",
        isActive &&
          "z-10 border-primary ring-4 ring-primary/10 shadow-[0_0_0_1px_theme(colors.primary)]",
        char && "border-primary/60 bg-secondary/30",
        className
      )}
      {...props}
    >
      {char && <span className="animate-in fade-in zoom-in-95 duration-150">{char}</span>}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-0.5 animate-pulse rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot };
