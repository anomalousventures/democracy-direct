import {
  type Representative,
  type Address,
  getRepresentativeTitle,
  formatLetterDate,
} from "../types/representative";
import { MarkdownContent } from "./MarkdownContent";
import { Icon } from "@/components/icons";

export interface PrintOptions {
  includeReturnAddress: boolean;
  includeDate: boolean;
  includeRecipientAddress: boolean;
  includeSalutation: boolean;
  includeClosing: boolean;
  includeSignatureLine: boolean;
}

export interface PrintReadiness {
  hasContent: boolean;
  hasName: boolean;
  hasCity: boolean;
  hasReturnAddress: boolean;
  allRequiredMet: boolean;
}

interface LetterPreviewProps {
  letterContent: string;
  representative: Representative;
  returnAddress: Address;
  className?: string;
  printOptions?: PrintOptions;
  printReadiness?: PrintReadiness;
}

export const defaultPrintOptions: PrintOptions = {
  includeReturnAddress: true,
  includeDate: true,
  includeRecipientAddress: true,
  includeSalutation: false,
  includeClosing: false,
  includeSignatureLine: true,
};

export function LetterPreview({
  letterContent,
  representative,
  returnAddress,
  className = "",
  printOptions = defaultPrintOptions,
  printReadiness,
}: LetterPreviewProps) {
  const repTitle = getRepresentativeTitle(representative);
  const addressLines = representative.office_address?.split("\n") ?? [];
  const hasReturnAddress =
    printOptions.includeReturnAddress &&
    (returnAddress.name || returnAddress.street || returnAddress.city);
  const hasCityStateZip = returnAddress.city || returnAddress.state || returnAddress.zip;
  const bodyContent = letterContent.trim();
  const showHeader = printReadiness !== undefined;

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-3 no-print">
          <Icon name="file-text" className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-primary">Preview of your printed letter</span>
          {printReadiness.allRequiredMet ? (
            <span className="text-xs text-green-600 ml-auto flex items-center gap-1">
              <Icon name="check" className="size-3" aria-hidden="true" />
              Ready to print
            </span>
          ) : (
            <span className="text-xs text-muted-foreground ml-auto">
              Fill required fields above
            </span>
          )}
        </div>
      )}
      <div
        data-testid="print-preview"
        className={`print-preview bg-white border border-border p-8 min-h-[400px] font-serif`}
      >
        <div className="space-y-6">
          {hasReturnAddress && (
            <div className="text-sm">
              {returnAddress.name && <div>{returnAddress.name}</div>}
              {returnAddress.street && <div>{returnAddress.street}</div>}
              {hasCityStateZip && (
                <div>
                  {returnAddress.city}
                  {returnAddress.city && returnAddress.state && ", "}
                  {returnAddress.state} {returnAddress.zip}
                </div>
              )}
            </div>
          )}

          {printOptions.includeDate && <div className="text-sm">{formatLetterDate()}</div>}

          {printOptions.includeRecipientAddress && (
            <div className="text-sm">
              <div>
                {repTitle} {representative.first_name} {representative.last_name}
              </div>
              {addressLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}

          {printOptions.includeSalutation && (
            <div className="text-sm">
              Dear {repTitle} {representative.last_name},
            </div>
          )}

          <MarkdownContent content={bodyContent} className="text-sm leading-relaxed" />

          {(printOptions.includeClosing || printOptions.includeSignatureLine) && (
            <div className="text-sm space-y-8">
              {printOptions.includeClosing && (
                <div>
                  <div>Sincerely,</div>
                  {returnAddress.name && <div className="mt-8">{returnAddress.name}</div>}
                </div>
              )}
              {printOptions.includeSignatureLine && (
                <div className="border-b border-gray-400 w-48">&nbsp;</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
