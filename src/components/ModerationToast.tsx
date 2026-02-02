import { useEffect } from "react";
import { toast } from "sonner";

type ModerationToastDetail = {
  type: "success" | "error";
  message: string;
};

export function ModerationToast() {
  useEffect(() => {
    const handler = (e: CustomEvent<ModerationToastDetail>) => {
      if (e.detail.type === "success") {
        toast.success(e.detail.message);
      } else {
        toast.error(e.detail.message);
      }
    };
    window.addEventListener("moderation-toast", handler as EventListener);
    return () => window.removeEventListener("moderation-toast", handler as EventListener);
  }, []);

  return null;
}
