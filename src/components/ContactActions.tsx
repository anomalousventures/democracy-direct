import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { ContactFormRedirectDialog } from "./ContactFormRedirectDialog";
import type { Representative } from "../types/representative";
import { useAnalytics } from "@/hooks/useAnalytics";
import { markdownToPlainText } from "@/lib/markdown";

interface ContactActionsProps {
  content: string;
  representative: Representative;
  bioguideId?: string;
}

export function ContactActions({ content, representative, bioguideId }: ContactActionsProps) {
  const { capture } = useAnalytics();
  const repName = `${representative.first_name} ${representative.last_name}`;
  const repTitle = representative.chamber === "senate" ? "Senator" : "Representative";

  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      const plainText = markdownToPlainText(content);
      await navigator.clipboard.writeText(plainText);
      capture("letter_copied", { repBioguideId: bioguideId, repName });
      toast.success("Copied to clipboard!");
      return true;
    } catch {
      toast.error("Failed to copy to clipboard");
      return false;
    }
  }, [content, capture, bioguideId, repName]);

  const handleContactFormClick = useCallback(async () => {
    const copied = await copyToClipboard();
    if (copied && representative.contact_form) {
      setIsRedirectDialogOpen(true);
    }
  }, [copyToClipboard, representative.contact_form]);

  const handleGoToForm = useCallback(() => {
    capture("contact_form_clicked", { repBioguideId: bioguideId, repName });
    setIsRedirectDialogOpen(false);
  }, [capture, bioguideId, repName]);

  const handlePhoneClick = useCallback(() => {
    capture("phone_called", { repBioguideId: bioguideId, repName });
  }, [capture, bioguideId, repName]);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={copyToClipboard}>
          <Icon name="copy" className="size-4" aria-hidden="true" />
          Copy Letter
        </Button>

        {representative.contact_form && (
          <Button variant="default" onClick={handleContactFormClick}>
            <Icon name="external-link" className="size-4" aria-hidden="true" />
            Send via Contact Form
          </Button>
        )}

        {representative.phone && (
          <Button variant="outline" asChild>
            <a href={`tel:${representative.phone}`} onClick={handlePhoneClick}>
              <Icon name="phone" className="size-4" aria-hidden="true" />
              Call Office
            </a>
          </Button>
        )}
      </div>

      <ContactFormRedirectDialog
        open={isRedirectDialogOpen}
        onOpenChange={setIsRedirectDialogOpen}
        repTitle={repTitle}
        repName={repName}
        contactFormUrl={representative.contact_form}
        onGoToForm={handleGoToForm}
      />
    </>
  );
}
