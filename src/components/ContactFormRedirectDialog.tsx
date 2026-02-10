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

interface ContactFormRedirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repTitle: string;
  repName: string;
  contactFormUrl: string | undefined;
  onGoToForm: () => void;
}

export function ContactFormRedirectDialog({
  open,
  onOpenChange,
  repTitle,
  repName,
  contactFormUrl,
  onGoToForm,
}: ContactFormRedirectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              Paste your letter using <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+V</kbd> (or{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded">⌘+V</kbd> on Mac)
            </li>
            <li>Fill in any required fields and submit</li>
          </ol>
        </div>
        <DialogFooter>
          <Button variant="default" asChild>
            <a
              href={contactFormUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onGoToForm}
            >
              <Icon name="external-link" className="size-4" aria-hidden="true" />
              Go to Contact Form
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
