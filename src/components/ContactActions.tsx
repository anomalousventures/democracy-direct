import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TbCopy, TbExternalLink, TbPhone } from "react-icons/tb";
import type { Representative } from "../types/representative";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ContactActionsProps {
  content: string;
  representative: Representative;
  bioguideId?: string;
}

export function ContactActions({ content, representative, bioguideId }: ContactActionsProps) {
  const { capture } = useAnalytics();
  const repName = `${representative.first_name} ${representative.last_name}`;

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      capture("letter_copied", { repBioguideId: bioguideId, repName });
      toast.success("Copied to clipboard!");
      return true;
    } catch {
      toast.error("Failed to copy to clipboard");
      return false;
    }
  }, [content, capture, bioguideId, repName]);

  const handleContactForm = useCallback(async () => {
    const copied = await copyToClipboard();
    if (copied && representative.contact_form) {
      capture("contact_form_clicked", { repBioguideId: bioguideId, repName });
      window.open(representative.contact_form, "_blank", "noopener,noreferrer");
      toast.success("Copied! Paste your letter into the contact form.");
    }
  }, [copyToClipboard, representative.contact_form, capture, bioguideId, repName]);

  const handlePhoneClick = useCallback(() => {
    capture("phone_called", { repBioguideId: bioguideId, repName });
  }, [capture, bioguideId, repName]);

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={copyToClipboard}>
        <TbCopy className="size-4" aria-hidden="true" />
        Copy Letter
      </Button>

      {representative.contact_form && (
        <Button variant="default" onClick={handleContactForm}>
          <TbExternalLink className="size-4" aria-hidden="true" />
          Send via Contact Form
        </Button>
      )}

      {representative.phone && (
        <Button variant="outline" asChild>
          <a href={`tel:${representative.phone}`} onClick={handlePhoneClick}>
            <TbPhone className="size-4" aria-hidden="true" />
            Call Office
          </a>
        </Button>
      )}
    </div>
  );
}
