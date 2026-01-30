import { useState, useCallback, useEffect, useRef } from "react";
import {
  generateTypedShareUrls,
  generateTemplateShareText,
  generateRepShareText,
  supportsWebShare,
  triggerWebShare,
} from "@/lib/share";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SiX, SiFacebook, SiReddit } from "react-icons/si";
import { TbShare, TbMail, TbLink } from "react-icons/tb";

interface RepInfo {
  name: string;
  party: string;
  state: string;
}

type ShareButtonsProps =
  | {
      url: string;
      title: string;
      description?: string;
      pageType: "template";
      repInfo?: never;
    }
  | {
      url: string;
      title: string;
      description?: string;
      pageType: "rep";
      repInfo: RepInfo;
    };

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export function ShareButtons({ url, title, description, pageType, repInfo }: ShareButtonsProps) {
  const [toast, setToast] = useState<ToastState>(null);
  const [hasWebShare, setHasWebShare] = useState(false);
  const { capture } = useAnalytics();
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHasWebShare(supportsWebShare());
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const getShareText = useCallback((): string => {
    if (pageType === "template") {
      return generateTemplateShareText(title);
    }
    if (pageType === "rep" && repInfo) {
      return generateRepShareText(repInfo.name, repInfo.party, repInfo.state);
    }
    return title;
  }, [pageType, title, repInfo]);

  const trackShare = useCallback(
    (platform: string) => {
      capture("share_clicked", {
        platform,
        pageType,
        url,
      });
    },
    [capture, pageType, url]
  );

  const handleNativeShare = useCallback(async () => {
    trackShare("native");
    const shareText = getShareText();
    await triggerWebShare({
      url,
      title,
      description: description || shareText,
    });
  }, [url, title, description, getShareText, trackShare]);

  const handleCopyLink = useCallback(async () => {
    trackShare("copy");
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy link", "error");
    }
  }, [url, trackShare, showToast]);

  const shareUrls =
    pageType === "template"
      ? generateTypedShareUrls({
          url,
          title,
          description,
          pageType: "template",
        })
      : generateTypedShareUrls({
          url,
          title,
          description,
          pageType: "rep",
          repName: repInfo!.name,
          repParty: repInfo!.party,
          repState: repInfo!.state,
        });

  const handlePlatformClick = useCallback(
    (platform: string, shareUrl: string) => {
      trackShare(platform);
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    },
    [trackShare]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {hasWebShare && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-civic-navy)] bg-[var(--color-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:border-[var(--color-civic-navy)] transition-colors"
            type="button"
            aria-label="Share this page"
          >
            <TbShare className="w-[18px] h-[18px]" aria-hidden="true" />
            <span>Share</span>
          </button>
        )}

        <button
          onClick={() => handlePlatformClick("twitter", shareUrls.twitter)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-civic-navy)] bg-[var(--color-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:border-[var(--color-civic-navy)] transition-colors"
          type="button"
          aria-label="Share on X (Twitter)"
        >
          <SiX className="w-[16px] h-[16px]" aria-hidden="true" />
          <span className="hidden sm:inline">X</span>
        </button>

        <button
          onClick={() => handlePlatformClick("facebook", shareUrls.facebook)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-civic-navy)] bg-[var(--color-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:border-[var(--color-civic-navy)] transition-colors"
          type="button"
          aria-label="Share on Facebook"
        >
          <SiFacebook className="w-[16px] h-[16px]" aria-hidden="true" />
          <span className="hidden sm:inline">Facebook</span>
        </button>

        <button
          onClick={() => handlePlatformClick("reddit", shareUrls.reddit)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-civic-navy)] bg-[var(--color-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:border-[var(--color-civic-navy)] transition-colors"
          type="button"
          aria-label="Share on Reddit"
        >
          <SiReddit className="w-[16px] h-[16px]" aria-hidden="true" />
          <span className="hidden sm:inline">Reddit</span>
        </button>

        <a
          href={shareUrls.email}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-civic-navy)] bg-[var(--color-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:border-[var(--color-civic-navy)] transition-colors"
          aria-label="Share via Email"
          onClick={() => trackShare("email")}
        >
          <TbMail className="w-[18px] h-[18px]" aria-hidden="true" />
          <span className="hidden sm:inline">Email</span>
        </a>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-civic-navy)] bg-[var(--color-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:border-[var(--color-civic-navy)] transition-colors"
          type="button"
          aria-label="Copy link to clipboard"
        >
          <TbLink className="w-[18px] h-[18px]" aria-hidden="true" />
          <span className="hidden sm:inline">Copy Link</span>
        </button>
      </div>

      {toast && (
        <div
          className={`inline-block px-3 py-1.5 rounded text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
