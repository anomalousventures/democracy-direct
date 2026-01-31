import { useState, useCallback, useEffect, type ComponentType } from "react";
import {
  generateTypedShareUrls,
  generateTemplateShareText,
  generateRepShareText,
  supportsWebShare,
  triggerWebShare,
  type ShareUrls,
} from "@/lib/share";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { SiX, SiFacebook, SiReddit } from "react-icons/si";
import { TbShare, TbMail, TbLink } from "react-icons/tb";
import { toast } from "sonner";

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

interface PlatformConfig {
  key: keyof ShareUrls;
  icon: ComponentType<{ className?: string }>;
  label: string;
  displayName: string;
}

const platformButtons: PlatformConfig[] = [
  { key: "twitter", icon: SiX, label: "Share on X (Twitter)", displayName: "X" },
  { key: "facebook", icon: SiFacebook, label: "Share on Facebook", displayName: "Facebook" },
  { key: "reddit", icon: SiReddit, label: "Share on Reddit", displayName: "Reddit" },
];

function getShareUrls(props: ShareButtonsProps): ShareUrls {
  if (props.pageType === "template") {
    return generateTypedShareUrls({
      url: props.url,
      title: props.title,
      description: props.description,
      pageType: "template",
    });
  }
  return generateTypedShareUrls({
    url: props.url,
    title: props.title,
    description: props.description,
    pageType: "rep",
    repName: props.repInfo.name,
    repParty: props.repInfo.party,
    repState: props.repInfo.state,
  });
}

export function ShareButtons(props: ShareButtonsProps) {
  const { url, title, description, pageType, repInfo } = props;
  const [hasWebShare, setHasWebShare] = useState(false);
  const { capture } = useAnalytics();

  useEffect(() => {
    setHasWebShare(supportsWebShare());
  }, []);

  const getShareText = useCallback((): string => {
    if (pageType === "template") {
      return generateTemplateShareText(title);
    }
    if (repInfo) {
      return generateRepShareText(repInfo.name, repInfo.party, repInfo.state);
    }
    return title;
  }, [pageType, title, repInfo]);

  const trackShare = useCallback(
    (platform: string) => {
      capture("share_clicked", { platform, pageType, url });
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
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [url, trackShare]);

  const shareUrls = getShareUrls(props);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {hasWebShare && (
          <Button
            onClick={handleNativeShare}
            variant="outline"
            size="sm"
            aria-label="Share this page"
          >
            <TbShare className="size-4" aria-hidden="true" />
            <span>Share</span>
          </Button>
        )}

        {platformButtons.map(({ key, icon: Icon, label, displayName }) => (
          <Button key={key} variant="outline" size="sm" asChild>
            <a
              href={shareUrls[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              onClick={() => trackShare(key)}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{displayName}</span>
            </a>
          </Button>
        ))}

        <Button variant="outline" size="sm" asChild>
          <a
            href={shareUrls.email}
            aria-label="Share via Email"
            onClick={() => trackShare("email")}
          >
            <TbMail className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Email</span>
          </a>
        </Button>

        <Button
          onClick={handleCopyLink}
          variant="outline"
          size="sm"
          aria-label="Copy link to clipboard"
        >
          <TbLink className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Copy Link</span>
        </Button>
      </div>
    </div>
  );
}
