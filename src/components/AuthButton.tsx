import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/LoginDialog";

interface AuthButtonProps {
  isLoggedIn: boolean;
}

export function AuthButton({ isLoggedIn }: AuthButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <svg
            className="w-4 h-4 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        Sign In
      </Button>
      <LoginDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleLoginSuccess} />
    </>
  );
}
