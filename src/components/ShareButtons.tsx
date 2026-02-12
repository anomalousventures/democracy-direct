import { useState, useCallback, useEffect } from "react";
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
import { Icon, type IconName } from "@/components/icons";
import { toast } from "@/lib/toast";

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
  iconName: IconName;
  label: string;
  displayName: string;
}

const platformButtons: PlatformConfig[] = [
  { key: "twitter", iconName: "brand-x", label: "Share on X (Twitter)", displayName: "X" },
  {
    key: "facebook",
    iconName: "brand-facebook",
    label: "Share on Facebook",
    displayName: "Facebook",
  },
  { key: "reddit", iconName: "brand-reddit", label: "Share on Reddit", displayName: "Reddit" },
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

  if (hasWebShare) {
    return (
      <Button onClick={handleNativeShare} variant="outline" size="sm" aria-label="Share this page">
        <Icon name="share" className="size-4" aria-hidden="true" />
        <span>Share this page</span>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {platformButtons.map(({ key, iconName, label, displayName }) => (
        <Button key={key} variant="outline" size="sm" asChild>
          <a
            href={shareUrls[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            onClick={() => trackShare(key)}
          >
            <Icon name={iconName} className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{displayName}</span>
          </a>
        </Button>
      ))}

      <Button variant="outline" size="sm" asChild>
        <a href={shareUrls.email} aria-label="Share via Email" onClick={() => trackShare("email")}>
          <Icon name="mail" className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Email</span>
        </a>
      </Button>

      <Button
        onClick={handleCopyLink}
        variant="outline"
        size="sm"
        aria-label="Copy link to clipboard"
      >
        <Icon name="link" className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>
    </div>
  );
}
