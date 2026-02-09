import { Icon } from "@/components/icons";
import { sanitizeExternalUrl } from "@/lib/url";

export interface ContactInfoProps {
  phone?: string;
  contactFormUrl?: string;
  address?: string;
  website?: string;
  twitterHandle?: string;
  facebookId?: string;
}

export function ContactInfo({
  phone,
  contactFormUrl,
  address,
  website,
  twitterHandle,
  facebookId,
}: ContactInfoProps) {
  function getHostname(url: string): string {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  }

  const safeWebsite = sanitizeExternalUrl(website ?? null);
  const safeContactFormUrl = sanitizeExternalUrl(contactFormUrl ?? null);

  const hasSocial = twitterHandle || facebookId;
  const hasAnyInfo = phone || safeContactFormUrl || address || safeWebsite || hasSocial;

  if (!hasAnyInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No contact information available.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-primary mb-4">Contact Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {phone && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="info-item-link">
            <div className="icon-box-sm self-center">
              <Icon name="phone" className="w-5 h-5 text-accent" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-medium">DC Office Phone</p>
              <p className="text-primary text-lg">{phone}</p>
            </div>
          </a>
        )}

        {safeWebsite && (
          <a
            href={safeWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="info-item-link"
          >
            <div className="icon-box-sm self-center">
              <Icon name="globe" className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-medium">Official Website</p>
              <p className="inline-flex items-center gap-1 text-primary">
                <span>{getHostname(safeWebsite)}</span>
                <Icon name="external-link" className="w-4 h-4" />
              </p>
            </div>
          </a>
        )}

        {safeContactFormUrl && (
          <a
            href={safeContactFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="info-item-link"
          >
            <div className="icon-box-sm self-center">
              <Icon name="mail" className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-medium">Online Contact Form</p>
              <p className="inline-flex items-center gap-1 text-primary">
                <span>Send a message</span>
                <Icon name="external-link" className="w-4 h-4" />
              </p>
            </div>
          </a>
        )}

        {address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="info-item-link"
          >
            <div className="icon-box-sm self-center">
              <Icon name="map-pin" className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-medium">DC Office Address</p>
              <p className="inline-flex items-center gap-1 text-primary">
                <span className="whitespace-pre-line">{address}</span>
                <Icon name="external-link" className="w-4 h-4 flex-shrink-0" />
              </p>
            </div>
          </a>
        )}

        {twitterHandle && (
          <a
            href={`https://twitter.com/${twitterHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="info-item-link"
          >
            <div className="icon-box-sm self-center">
              <Icon name="brand-x" className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-medium">X (Twitter)</p>
              <p className="text-primary">@{twitterHandle}</p>
            </div>
          </a>
        )}

        {facebookId && (
          <a
            href={`https://facebook.com/${facebookId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="info-item-link"
          >
            <div className="icon-box-sm self-center">
              <Icon name="brand-facebook" className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-medium">Facebook</p>
              <p className="text-primary">View Profile</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
