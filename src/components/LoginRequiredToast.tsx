import { useEffect } from "react";
import { toast } from "sonner";

export function LoginRequiredToast() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "required") {
      toast.info("Please sign in to access that page", {
        description: "Click 'Sign In' in the header to continue.",
      });

      params.delete("login");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  return null;
}
