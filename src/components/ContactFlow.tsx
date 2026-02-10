import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/icons";
import { ContactFormRedirectDialog } from "./ContactFormRedirectDialog";
import { TiptapEditor } from "./TiptapEditor";
import { SenderInfoForm, type SenderInfo, createEmptySenderInfo } from "./SenderInfoForm";
import {
  LetterPreview,
  type PrintOptions,
  type PrintReadiness,
  defaultPrintOptions,
} from "./LetterPreview";
import { type Representative, getRepresentativeTitle } from "../types/representative";
import { substituteForRepresentative, parseTemplateVariables } from "@/lib/template-variables";
import { markdownToPlainText } from "@/lib/markdown";
import { formatDateMedium } from "@/lib/date-utils";
import { useAnalytics } from "@/hooks/useAnalytics";

type ViewMode = "edit" | "preview" | "print";
type ContactType = "call" | "contact_form" | "print" | "copy";

function recordTemplateUse(templateSlug: string, repBioguideId: string, contactType: ContactType) {
  fetch(`/api/templates/${templateSlug}/use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repBioguideId, contactType }),
    keepalive: true,
  }).catch(() => {});
}

interface ContactFlowProps {
  representative: Representative;
  initialTemplate?: string;
  templateName?: string;
  templateSlug?: string;
  repBioguideId?: string;
}

export function ContactFlow({
  representative,
  initialTemplate = "",
  templateName,
  templateSlug,
  repBioguideId,
}: ContactFlowProps) {
  const [letterContent, setLetterContent] = useState(initialTemplate);
  const [senderInfo, setSenderInfo] = useState<SenderInfo>(createEmptySenderInfo);
  const [printOptions, setPrintOptions] = useState<PrintOptions>(defaultPrintOptions);
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(formatDateMedium(new Date()));
  }, []);

  const { capture } = useAnalytics();
  const repName = `${representative.first_name} ${representative.last_name}`;
  const repTitle = getRepresentativeTitle(representative);

  const usedVariables = useMemo(() => parseTemplateVariables(letterContent), [letterContent]);
  const needsUserName = usedVariables.includes("USER_NAME");
  const needsUserCity = usedVariables.includes("USER_CITY");

  const handleSenderInfoChange = useCallback((info: SenderInfo) => {
    setSenderInfo(info);
  }, []);

  const substitutedContent = useMemo(
    () =>
      substituteForRepresentative(letterContent, representative, {
        name: senderInfo.name,
        city: senderInfo.city,
      }),
    [letterContent, representative, senderInfo.name, senderInfo.city]
  );

  const printReadiness: PrintReadiness = useMemo(() => {
    const hasContent = letterContent.trim().length > 0;
    const hasName = !needsUserName || senderInfo.name.trim().length > 0;
    const hasCity = !needsUserCity || senderInfo.city.trim().length > 0;
    const hasReturnAddress = senderInfo.name.trim().length > 0;

    return {
      hasContent,
      hasName,
      hasCity,
      hasReturnAddress,
      allRequiredMet: hasContent && hasName && hasCity,
    };
  }, [letterContent, needsUserName, needsUserCity, senderInfo.name, senderInfo.city]);

  const copyToClipboard = useCallback(async () => {
    try {
      const plainText = markdownToPlainText(substitutedContent);
      await navigator.clipboard.writeText(plainText);
      capture("letter_copied", { repBioguideId, repName });
      if (templateSlug && repBioguideId) {
        recordTemplateUse(templateSlug, repBioguideId, "copy");
      }
      toast.success("Copied to clipboard!");
      return true;
    } catch {
      toast.error("Failed to copy to clipboard");
      return false;
    }
  }, [substitutedContent, capture, repBioguideId, repName, templateSlug]);

  const handleContactFormClick = useCallback(async () => {
    const copied = await copyToClipboard();
    if (copied && representative.contact_form) {
      setIsRedirectDialogOpen(true);
    }
  }, [copyToClipboard, representative.contact_form]);

  const handleGoToForm = useCallback(() => {
    capture("contact_form_clicked", { repBioguideId, repName });
    if (templateSlug && repBioguideId) {
      recordTemplateUse(templateSlug, repBioguideId, "contact_form");
    }
    setIsRedirectDialogOpen(false);
  }, [capture, repBioguideId, repName, templateSlug]);

  const handlePhoneClick = useCallback(() => {
    capture("phone_called", { repBioguideId, repName });
    if (templateSlug && repBioguideId) {
      recordTemplateUse(templateSlug, repBioguideId, "call");
    }
  }, [capture, repBioguideId, repName, templateSlug]);

  const handlePrint = useCallback(() => {
    capture("letter_printed", { repBioguideId, repName, templateSlug });
    if (templateSlug && repBioguideId) {
      recordTemplateUse(templateSlug, repBioguideId, "print");
    }
    window.print();
  }, [capture, repBioguideId, repName, templateSlug]);

  const templatesUrl = repBioguideId ? `/templates?rep=${repBioguideId}` : "/templates";
  const hasContent = letterContent.trim().length > 0;

  return (
    <>
      <div className="card-civic-lg no-print">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-primary">Contact Your Representative</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {templateName && templateSlug ? (
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">Using:</span>
                <span className="font-medium text-primary">{templateName}</span>
                <a href={templatesUrl} className="text-accent hover:underline">
                  Change
                </a>
              </span>
            ) : (
              <a
                href={templatesUrl}
                className="inline-flex items-center gap-1 text-primary hover:text-accent transition-colors"
              >
                <Icon name="file-text" className="size-4" aria-hidden="true" />
                Browse Templates
              </a>
            )}
          </div>
        </header>

        {/* Main content - reorders on mobile via CSS */}
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Sidebar - comes FIRST on mobile (order-1), SECOND on desktop */}
          <aside className="order-1 lg:order-2 lg:w-80 lg:flex-shrink-0 space-y-4 mb-6 lg:mb-0">
            <SenderInfoForm
              onChange={handleSenderInfoChange}
              requiredForTemplate={{ name: needsUserName, city: needsUserCity }}
            />
          </aside>

          {/* Editor/Preview - comes SECOND on mobile (order-2), FIRST on desktop */}
          <div className="order-2 lg:order-1 lg:flex-1">
            {/* View mode buttons */}
            <div className="flex gap-1 mb-4 p-1 bg-muted rounded-md w-fit">
              <Button
                variant={viewMode === "edit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("edit")}
              >
                Edit
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                Preview
              </Button>
              <Button
                variant={viewMode === "print" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("print")}
              >
                Print Preview
              </Button>
            </div>

            {/* Edit view */}
            {viewMode === "edit" && (
              <TiptapEditor
                content={letterContent}
                onChange={setLetterContent}
                placeholder={`Write your letter to ${repTitle} ${representative.last_name}. Use {{REP_NAME}}, {{REP_TITLE}}, {{STATE}}, {{DISTRICT}} for auto-substitution...`}
              />
            )}

            {/* Preview view - shows substituted content without print formatting */}
            {viewMode === "preview" && (
              <LetterPreview
                letterContent={substitutedContent}
                representative={representative}
                returnAddress={senderInfo}
                printOptions={{
                  includeReturnAddress: false,
                  includeDate: false,
                  includeRecipientAddress: false,
                  includeSalutation: false,
                  includeClosing: false,
                  includeSignatureLine: false,
                }}
              />
            )}

            {/* Print Preview view - shows full letter with formatting options */}
            {viewMode === "print" && (
              <div className="space-y-4">
                {/* Letter Formatting Options */}
                <fieldset className="p-4 bg-muted/50 rounded-sm border border-border">
                  <legend className="text-sm font-medium text-primary px-2">
                    Letter Formatting
                  </legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="returnAddress"
                        checked={printOptions.includeReturnAddress}
                        onCheckedChange={(checked) =>
                          setPrintOptions((p) => ({ ...p, includeReturnAddress: checked === true }))
                        }
                      />
                      <Label htmlFor="returnAddress" className="text-sm cursor-pointer">
                        Your Address
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="date"
                        checked={printOptions.includeDate}
                        onCheckedChange={(checked) =>
                          setPrintOptions((p) => ({ ...p, includeDate: checked === true }))
                        }
                      />
                      <Label htmlFor="date" className="text-sm cursor-pointer">
                        Date
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="recipientAddress"
                        checked={printOptions.includeRecipientAddress}
                        onCheckedChange={(checked) =>
                          setPrintOptions((p) => ({
                            ...p,
                            includeRecipientAddress: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor="recipientAddress" className="text-sm cursor-pointer">
                        Rep Address
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="salutation"
                        checked={printOptions.includeSalutation}
                        onCheckedChange={(checked) =>
                          setPrintOptions((p) => ({ ...p, includeSalutation: checked === true }))
                        }
                      />
                      <Label htmlFor="salutation" className="text-sm cursor-pointer">
                        Salutation
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="closing"
                        checked={printOptions.includeClosing}
                        onCheckedChange={(checked) =>
                          setPrintOptions((p) => ({ ...p, includeClosing: checked === true }))
                        }
                      />
                      <Label htmlFor="closing" className="text-sm cursor-pointer">
                        Closing
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="signature"
                        checked={printOptions.includeSignatureLine}
                        onCheckedChange={(checked) =>
                          setPrintOptions((p) => ({ ...p, includeSignatureLine: checked === true }))
                        }
                      />
                      <Label htmlFor="signature" className="text-sm cursor-pointer">
                        Signature Line
                      </Label>
                    </div>
                  </div>
                </fieldset>

                <LetterPreview
                  letterContent={substitutedContent}
                  representative={representative}
                  returnAddress={senderInfo}
                  printOptions={printOptions}
                  printReadiness={printReadiness}
                  currentDate={currentDate}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions - ALWAYS visible */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {representative.contact_form && (
              <Button
                variant="default"
                size="lg"
                onClick={handleContactFormClick}
                disabled={!hasContent}
                className="col-span-2"
              >
                <Icon name="external-link" className="size-5" aria-hidden="true" />
                Send via Contact Form
              </Button>
            )}

            {representative.phone && (
              <Button variant="secondary" size="default" className="col-span-1" asChild>
                <a href={`tel:${representative.phone}`} onClick={handlePhoneClick}>
                  <Icon name="phone" className="size-4" aria-hidden="true" />
                  Call Office
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              size="default"
              onClick={handlePrint}
              disabled={!printReadiness.allRequiredMet}
              className="col-span-1"
            >
              <Icon name="printer" className="size-4" aria-hidden="true" />
              Print & Mail
            </Button>

            <Button
              variant="ghost"
              size="default"
              onClick={copyToClipboard}
              disabled={!hasContent}
              className="col-span-2"
            >
              <Icon name="copy" className="size-4" aria-hidden="true" />
              Copy
            </Button>
          </div>

          {!hasContent && (
            <p className="text-xs text-muted-foreground mt-2">
              Write your letter above to enable sending
            </p>
          )}
        </div>
      </div>

      {/* Print-only version */}
      <div className="print-only hidden">
        <LetterPreview
          letterContent={substitutedContent}
          representative={representative}
          returnAddress={senderInfo}
          printOptions={printOptions}
          currentDate={currentDate}
        />
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
