import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    TURNSTILE_SITE_KEY?: string;
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "email" | "otp";

export function LoginDialog({ open, onOpenChange, onSuccess }: LoginDialogProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderTurnstile = useCallback(() => {
    if (turnstileRef.current && window.turnstile && window.TURNSTILE_SITE_KEY) {
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: window.TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
      });
    }
  }, []);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setStep("email");
      setEmail("");
      setOtp("");
      setError(null);
      setIsLoading(false);
      setTurnstileToken(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && step === "email") {
      const timer = setTimeout(renderTurnstile, 100);
      return () => clearTimeout(timer);
    }
  }, [open, step, renderTurnstile]);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the verification");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send verification code");
        resetTurnstile();
        return;
      }

      setStep("otp");
      toast.info("Verification code sent to your email");
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
      resetTurnstile();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid or expired code");
        return;
      }

      toast.success("Successfully signed in!");
      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>{step === "email" ? "Sign In" : "Enter Verification Code"}</DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your email to receive a verification code"
              : `We sent a 6-digit code to ${email}`}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </p>
            )}

            <LoadingButton
              type="submit"
              variant="civic"
              className="w-full"
              loading={isLoading}
              loadingText="Sending..."
              disabled={!turnstileToken || !isValidEmail(email)}
            >
              Send Code
            </LoadingButton>

            <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              <svg
                className="inline-block w-3 h-3 mr-1 -mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              We never store your email address on our servers
            </p>

            <div
              ref={turnstileRef}
              data-testid="turnstile-widget"
              className="flex justify-center"
            />
          </form>
        ) : (
          <form
            onSubmit={handleOtpSubmit}
            className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200"
          >
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <InputOTP
                id="otp"
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isLoading}
                autoComplete="one-time-code"
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p className="text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
              <LoadingButton
                type="submit"
                variant="civic"
                className="flex-1"
                loading={isLoading}
                loadingText="Verifying..."
                disabled={otp.length !== 6}
              >
                Verify
              </LoadingButton>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
