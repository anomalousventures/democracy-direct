import { useState, useCallback, useEffect } from "react";
import { Menu, X, MapPin } from "lucide-react";
import { formatDistrictDisplay } from "@/lib/saved-district";
import { getStateName } from "@/lib/states";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  navLinks: NavLink[];
  currentPath: string;
  isAdmin: boolean;
  savedState: string | null;
  savedDistrict: string | null;
}

export function MobileNav({
  navLinks,
  currentPath,
  isAdmin,
  savedState,
  savedDistrict,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeMenu]);

  const hasDistrict = savedState && savedDistrict;
  const districtDisplay = hasDistrict ? formatDistrictDisplay(savedState, savedDistrict) : null;
  const stateName = savedState ? getStateName(savedState) : null;
  const repsUrl = hasDistrict
    ? `/reps/${savedState.toLowerCase()}/${savedDistrict.toLowerCase()}`
    : null;

  return (
    <>
      <button
        onClick={toggleMenu}
        className="p-2 -m-2 text-primary hover:text-primary/80 transition-colors md:hidden"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        data-testid="mobile-menu-button"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <a href="/" className="flex items-center gap-3" onClick={closeMenu}>
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <span
                  className="text-accent text-xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  D
                </span>
              </div>
              <span className="font-semibold text-primary">Democracy Direct</span>
            </a>
            <button
              onClick={closeMenu}
              className="p-2 -m-2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {hasDistrict && (
              <div className="px-4 mb-4">
                <div className="p-3 bg-[var(--color-civic-gold)]/10 border border-[var(--color-civic-gold)]/30 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-[var(--color-civic-gold)]" />
                    <span className="text-sm font-medium text-[var(--color-civic-navy)]">
                      Your District
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-civic-navy)]">
                    {districtDisplay}
                  </p>
                  <p className="text-xs text-muted-foreground">{stateName}</p>
                  {repsUrl && (
                    <a
                      href={repsUrl}
                      onClick={closeMenu}
                      className="mt-2 inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      View My Reps
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            <ul className="space-y-1 px-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={closeMenu}
                    className={`block px-4 py-3 rounded-md text-base transition-colors ${
                      currentPath === link.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}

              {isAdmin && (
                <li>
                  <a
                    href="/admin"
                    onClick={closeMenu}
                    className={`block px-4 py-3 rounded-md text-base transition-colors ${
                      currentPath.startsWith("/admin")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    Admin
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
