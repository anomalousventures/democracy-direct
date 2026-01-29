import {
  type Representative,
  type Address,
  getRepresentativeTitle,
  formatLetterDate,
} from "../types/representative";

export interface PrintOptions {
  includeSalutation: boolean;
  includeClosing: boolean;
  includeSignatureLine: boolean;
}

interface LetterPreviewProps {
  letterContent: string;
  representative: Representative;
  returnAddress: Address;
  className?: string;
  printOptions?: PrintOptions;
}

export function LetterPreview({
  letterContent,
  representative,
  returnAddress,
  className = "",
  printOptions = { includeSalutation: true, includeClosing: true, includeSignatureLine: true },
}: LetterPreviewProps) {
  const repTitle = getRepresentativeTitle(representative);
  const addressLines = representative.office_address?.split("\n") ?? [];
  const hasReturnAddress = returnAddress.name || returnAddress.street || returnAddress.city;
  const hasCityStateZip = returnAddress.city || returnAddress.state || returnAddress.zip;
  const bodyContent = letterContent.trim();

  return (
    <div
      data-testid="print-preview"
      className={`print-preview bg-white border border-[var(--color-border)] p-8 min-h-[400px] font-serif ${className}`}
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

        <div className="text-sm">{formatLetterDate()}</div>

        <div className="text-sm">
          <div>
            {repTitle} {representative.first_name} {representative.last_name}
          </div>
          {addressLines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>

        {printOptions.includeSalutation && (
          <div className="text-sm">
            Dear {repTitle} {representative.last_name},
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap leading-relaxed">{bodyContent}</div>

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
  );
}
