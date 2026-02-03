import {
  TbPhone,
  TbMail,
  TbMapPin,
  TbWorld,
  TbLink,
  TbBrandX,
  TbBrandFacebook,
} from "react-icons/tb";

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
  const hasSocial = twitterHandle || facebookId;
  const hasAnyInfo = phone || contactFormUrl || address || website || hasSocial;

  if (!hasAnyInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No contact information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">Contact Information</h2>

      {phone && (
        <div className="info-item">
          <div className="icon-box-sm">
            <TbPhone className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">DC Office Phone</p>
            <a href={`tel:${phone}`} className="text-primary hover:underline text-lg">
              {phone}
            </a>
          </div>
        </div>
      )}

      {website && (
        <div className="info-item">
          <div className="icon-box-sm">
            <TbWorld className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">Official Website</p>
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {website.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          </div>
        </div>
      )}

      {contactFormUrl && (
        <div className="info-item">
          <div className="icon-box-sm">
            <TbMail className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">Online Contact Form</p>
            <a
              href={contactFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Send a message
            </a>
          </div>
        </div>
      )}

      {address && (
        <div className="info-item">
          <div className="icon-box-sm">
            <TbMapPin className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">DC Office Address</p>
            <p className="text-muted-foreground whitespace-pre-line">{address}</p>
          </div>
        </div>
      )}

      {hasSocial && (
        <div className="info-item">
          <div className="icon-box-sm">
            <TbLink className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">Social Media</p>
            <div className="flex gap-4 mt-2">
              {twitterHandle && (
                <a
                  href={`https://twitter.com/${twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <TbBrandX className="w-5 h-5" aria-hidden="true" />
                  <span>@{twitterHandle}</span>
                </a>
              )}
              {facebookId && (
                <a
                  href={`https://facebook.com/${facebookId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <TbBrandFacebook className="w-5 h-5" aria-hidden="true" />
                  <span>Facebook</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
