import { useState, useCallback, useEffect } from "react";
import { User, FileText, MapPin, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginDialog } from "@/components/LoginDialog";
import { Button } from "@/components/ui/button";
import {
  formatDistrictDisplay,
  getSavedDistrict,
  clearSavedDistrict,
  type SavedDistrict,
} from "@/lib/saved-district";
import { getStateName } from "@/lib/states";

interface UserMenuProps {
  isLoggedIn: boolean;
  savedState: string | null;
  savedDistrict: string | null;
  isAdmin?: boolean;
}

export function UserMenu({ isLoggedIn, savedState, savedDistrict, isAdmin }: UserMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localDistrict, setLocalDistrict] = useState<SavedDistrict | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocalDistrict(getSavedDistrict());
    }
  }, [isLoggedIn]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  const handleLoginSuccess = useCallback(() => {
    window.location.reload();
  }, []);

  const handleClearDistrict = useCallback(async () => {
    setIsClearing(true);
    try {
      if (isLoggedIn) {
        const response = await fetch("/api/user/district", { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to clear district");
        }
        window.location.reload();
      } else {
        clearSavedDistrict();
        setLocalDistrict(null);
      }
    } catch (err) {
      console.error("Failed to clear district:", err);
    } finally {
      setIsClearing(false);
    }
  }, [isLoggedIn]);

  const effectiveState = isLoggedIn ? savedState : (localDistrict?.state ?? null);
  const effectiveDistrict = isLoggedIn ? savedDistrict : (localDistrict?.district ?? null);
  const hasDistrict = effectiveState && effectiveDistrict;
  const districtDisplay = hasDistrict
    ? formatDistrictDisplay(effectiveState, effectiveDistrict)
    : null;
  const stateName = effectiveState ? getStateName(effectiveState) : null;
  const repsUrl = hasDistrict
    ? `/reps/${effectiveState.toLowerCase()}/${effectiveDistrict.toLowerCase()}`
    : null;

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        {hasDistrict && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-[var(--color-civic-gold)]/10 border border-[var(--color-civic-gold)]/30 rounded-md hover:bg-[var(--color-civic-gold)]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-gold)]/30"
                data-testid="district-badge"
              >
                <MapPin className="w-3.5 h-3.5 text-[var(--color-civic-gold)]" />
                <span className="font-medium text-[var(--color-civic-navy)]">
                  {districtDisplay}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{districtDisplay}</span>
                  <span className="text-xs text-muted-foreground">{stateName}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {repsUrl && (
                <DropdownMenuItem asChild>
                  <a href={repsUrl} className="cursor-pointer">
                    <MapPin className="w-4 h-4" />
                    View My Reps
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleClearDistrict}
                disabled={isClearing}
                className="cursor-pointer text-muted-foreground focus:text-foreground"
              >
                {isClearing ? "Clearing..." : "Change District"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          data-testid="sign-in-button"
        >
          Sign In
        </Button>
        <LoginDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          data-testid="user-menu-trigger"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {hasDistrict && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-civic-gold)]" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{districtDisplay}</span>
                  <span className="text-xs text-muted-foreground">{stateName}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {repsUrl && (
              <DropdownMenuItem asChild>
                <a href={repsUrl} className="cursor-pointer">
                  View My Reps
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleClearDistrict}
              disabled={isClearing}
              className="cursor-pointer text-muted-foreground focus:text-foreground text-sm"
            >
              {isClearing ? "Clearing..." : "Change District"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <a href="/templates/mine" className="cursor-pointer">
            <FileText className="w-4 h-4" />
            My Templates
          </a>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem asChild>
            <a href="/admin" className="cursor-pointer">
              Admin
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-muted-foreground focus:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
