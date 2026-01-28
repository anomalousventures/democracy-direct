import { useState, useCallback } from "react";

export interface Representative {
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  district: string | null;
  chamber: "senate" | "house";
  contact_form?: string;
  phone?: string;
  office_address?: string;
}

interface ContactActionsProps {
  content: string;
  representative: Representative;
}

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export function ContactActions({ content, representative }: ContactActionsProps) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      showToast("Copied to clipboard!", "success");
      return true;
    } catch {
      showToast("Failed to copy to clipboard", "error");
      return false;
    }
  }, [content, showToast]);

  const handleContactForm = useCallback(async () => {
    const copied = await copyToClipboard();
    if (copied && representative.contact_form) {
      window.open(representative.contact_form, "_blank", "noopener,noreferrer");
      showToast("Copied! Paste your letter into the contact form.", "success");
    }
  }, [copyToClipboard, representative.contact_form, showToast]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={copyToClipboard}
          className="btn-civic-secondary flex items-center gap-2"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          Copy Letter
        </button>

        {representative.contact_form && (
          <button
            onClick={handleContactForm}
            className="btn-civic flex items-center gap-2"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
            Send via Contact Form
          </button>
        )}

        {representative.phone && (
          <a
            href={`tel:${representative.phone}`}
            className="btn-civic-secondary flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call Office
          </a>
        )}
      </div>

      {toast && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
