import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

      <Dialog open={isRedirectDialogOpen} onOpenChange={setIsRedirectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="check" className="size-5 text-green-600" aria-hidden="true" />
              Letter Copied to Clipboard
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Your letter has been copied and is ready to paste into {repTitle} {repName}'s contact
              form.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-sm bg-secondary p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Next steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click the button below to open the contact form</li>
              <li>Look for the message or comment field</li>
              <li>
                Paste your letter using <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+V</kbd>{" "}
                (or <kbd className="px-1 py-0.5 bg-muted rounded">⌘+V</kbd> on Mac)
              </li>
              <li>Fill in any required fields and submit</li>
            </ol>
          </div>
          <DialogFooter>
            <Button variant="default" asChild>
              <a
                href={representative.contact_form}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleGoToForm}
              >
                <Icon name="external-link" className="size-4" aria-hidden="true" />
                Go to Contact Form
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
