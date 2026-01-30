import { useState, useCallback, useEffect } from "react";
import {
  generateShareUrls,
  generateTemplateShareText,
  generateRepShareText,
  supportsWebShare,
  triggerWebShare,
} from "@/lib/share";
import { useAnalytics } from "@/hooks/useAnalytics";

type PageType = "template" | "rep";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  pageType: PageType;
  repInfo?: {
    name: string;
    party: string;
    state: string;
  };
}

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export function ShareButtons({ url, title, description, pageType, repInfo }: ShareButtonsProps) {
  const [toast, setToast] = useState<ToastState>(null);
  const [hasWebShare, setHasWebShare] = useState(false);
  const { capture } = useAnalytics();

  useEffect(() => {
    setHasWebShare(supportsWebShare());
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  const shareText = getShareText();
  const shareUrls = generateShareUrls({
    url,
    title: shareText,
    description: description || shareText,
  });

  const handlePlatformClick = useCallback(
    (platform: string, shareUrl: string) => {
      trackShare(platform);
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    },
    [trackShare]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600 mr-1">Share:</span>

        {hasWebShare ? (
          <button
            onClick={handleNativeShare}
            className="share-btn"
            type="button"
            aria-label="Share"
            title="Share"
          >
            <ShareIcon />
            <span className="sr-only">Share</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => handlePlatformClick("twitter", shareUrls.twitter)}
              className="share-btn"
              type="button"
              aria-label="Share on X (Twitter)"
              title="Share on X"
            >
              <XIcon />
            </button>

            <button
              onClick={() => handlePlatformClick("facebook", shareUrls.facebook)}
              className="share-btn"
              type="button"
              aria-label="Share on Facebook"
              title="Share on Facebook"
            >
              <FacebookIcon />
            </button>

            <button
              onClick={() => handlePlatformClick("reddit", shareUrls.reddit)}
              className="share-btn"
              type="button"
              aria-label="Share on Reddit"
              title="Share on Reddit"
            >
              <RedditIcon />
            </button>

            <a
              href={shareUrls.email}
              className="share-btn"
              aria-label="Share via Email"
              title="Share via Email"
              onClick={() => trackShare("email")}
            >
              <EmailIcon />
            </a>
          </>
        )}

        <button
          onClick={handleCopyLink}
          className="share-btn"
          type="button"
          aria-label="Copy link"
          title="Copy link"
        >
          <LinkIcon />
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

function ShareIcon() {
  return (
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
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function EmailIcon() {
  return (
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
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LinkIcon() {
  return (
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
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
