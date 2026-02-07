import { useState, useCallback, useEffect } from "react";
import { Icon } from "@/components/icons";
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
import { formatDistrictDisplay, type SavedDistrict } from "@/lib/saved-district";
import { getStateName } from "@/lib/states";
import { useMe } from "@/hooks/useMe";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { hasLegacyData, hasAnonData, migrateAnonymousData } from "@/lib/storage-migration";
import { toast } from "sonner";

const publicNavLinks = [
  { href: "/about", label: "About" },
  { href: "/legislation", label: "Legislation" },
  { href: "/templates", label: "Templates" },
];

export function UserMenu() {
  const { user, isLoggedIn, isLoading, refetch, clear } = useMe();
  const districtStorage = useLocalStorage<SavedDistrict>("DISTRICT");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localDistrict, setLocalDistrict] = useState<SavedDistrict | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const loadLocalDistrict = async () => {
      if (!isLoggedIn) {
        const saved = await districtStorage.get();
        setLocalDistrict(saved);
      }
    };

    loadLocalDistrict();
  }, [isLoggedIn, isLoading, districtStorage]);

  useEffect(() => {
    if (isLoading || !isLoggedIn || !user) return;

    const migrate = async () => {
      if (hasLegacyData() || hasAnonData()) {
        await migrateAnonymousData(user.id, user.emailHash);
      }
    };

    migrate();
  }, [isLoading, isLoggedIn, user]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clear();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [clear]);

  const handleLoginSuccess = useCallback(() => {
    refetch();
    window.location.reload();
  }, [refetch]);

  const handleClearDistrict = useCallback(async () => {
    setIsClearing(true);
    try {
      if (isLoggedIn) {
        const response = await fetch("/api/user/district", { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to clear district");
        }
      }
      await districtStorage.remove();
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to clear district:", err);
      toast.error("Failed to clear district");
      setIsClearing(false);
    }
  }, [isLoggedIn, districtStorage]);

  const effectiveState = isLoggedIn ? user?.savedState : (localDistrict?.state ?? null);
  const effectiveDistrict = isLoggedIn ? user?.savedDistrict : (localDistrict?.district ?? null);
  const hasDistrict = effectiveState && effectiveDistrict;
  const districtDisplay = hasDistrict
    ? formatDistrictDisplay(effectiveState, effectiveDistrict)
    : null;
  const stateName = effectiveState ? getStateName(effectiveState) : null;
  const repsUrl = hasDistrict
    ? `/reps/${effectiveState.toLowerCase()}/${effectiveDistrict.toLowerCase()}`
    : null;

  const districtSection = hasDistrict && (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex items-center gap-2">
          <Icon name="map-pin" className="w-4 h-4 text-accent" />
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
        {isClearing ? "Clearing..." : "Clear Saved District"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );

  return (
    <div className="flex items-center gap-2">
      {/* Mobile: Single hamburger menu for all navigation */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            data-testid="mobile-menu-trigger"
            aria-label="Open menu"
          >
            <Icon name="menu" className="w-5 h-5" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {publicNavLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <a href={link.href} className="cursor-pointer">
                {link.label}
              </a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />

          {districtSection}

          {isLoggedIn ? (
            <>
              <DropdownMenuItem asChild>
                <a href="/templates/mine" className="cursor-pointer">
                  <Icon name="file-text" className="w-4 h-4" />
                  My Templates
                </a>
              </DropdownMenuItem>
              {user?.isAdmin && (
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
                <Icon name="logout" className="w-4 h-4" />
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => setDialogOpen(true)} className="cursor-pointer">
              <Icon name="user" className="w-4 h-4" />
              Sign In
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Desktop: District badge (if set) */}
      {hasDistrict && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-accent/10 border border-accent/30 rounded-sm hover:bg-accent/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30"
              data-testid="district-badge"
            >
              <Icon name="map-pin" className="w-3.5 h-3.5 text-accent" />
              <span className="font-medium text-primary">{districtDisplay}</span>
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
                  <Icon name="map-pin" className="w-4 h-4" />
                  View My Reps
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleClearDistrict}
              disabled={isClearing}
              className="cursor-pointer text-muted-foreground focus:text-foreground"
            >
              {isClearing ? "Clearing..." : "Clear Saved District"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Desktop logged out: Sign In button */}
      {!isLoggedIn && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          data-testid="sign-in-button"
          className="hidden md:inline-flex"
        >
          Sign In
        </Button>
      )}

      {/* Desktop logged in: User avatar dropdown */}
      {isLoggedIn && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hidden md:flex items-center gap-2 p-1.5 rounded-full hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="user-menu-trigger"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Icon name="user" className="w-4 h-4 text-primary-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <a href="/templates/mine" className="cursor-pointer">
                <Icon name="file-text" className="w-4 h-4" />
                My Templates
              </a>
            </DropdownMenuItem>
            {user?.isAdmin && (
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
              <Icon name="logout" className="w-4 h-4" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <LoginDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleLoginSuccess} />
    </div>
  );
}
