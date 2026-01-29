import { useState, useMemo, useCallback } from "react";
import { LetterComposer } from "./LetterComposer";
import { ContactActions } from "./ContactActions";
import { AddressForm } from "./AddressForm";
import { LetterPreview, type PrintOptions } from "./LetterPreview";
import { UserInfoInputs } from "./UserInfoInputs";
import { type Representative, type Address, createEmptyAddress } from "../types/representative";
import { substituteForRepresentative, parseTemplateVariables } from "@/lib/template-variables";

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
  const [returnAddress, setReturnAddress] = useState<Address>(createEmptyAddress);
  const [userInfo, setUserInfo] = useState({ name: "", city: "" });
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    includeSalutation: false,
    includeClosing: false,
    includeSignatureLine: false,
  });

  const usedVariables = useMemo(() => parseTemplateVariables(letterContent), [letterContent]);
  const needsUserName = usedVariables.includes("USER_NAME");
  const needsUserCity = usedVariables.includes("USER_CITY");

  const handleUserInfoChange = useCallback((info: { name: string; city: string }) => {
    setUserInfo(info);
    setReturnAddress((prev) => ({
      ...prev,
      name: info.name || prev.name,
      city: info.city || prev.city,
    }));
  }, []);

  const substitutedContent = useMemo(
    () =>
      substituteForRepresentative(letterContent, representative, {
        name: userInfo.name || returnAddress.name,
        city: userInfo.city || returnAddress.city,
      }),
    [
      letterContent,
      representative,
      userInfo.name,
      userInfo.city,
      returnAddress.name,
      returnAddress.city,
    ]
  );

  function handlePrint(): void {
    window.print();
  }

  const templatesUrl = repBioguideId ? `/templates?rep=${repBioguideId}` : "/templates";

  return (
    <div className="space-y-8">
      <div className="card-civic no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-civic-navy)]">Write Your Letter</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {templateName && templateSlug ? (
              <span className="flex items-center gap-2">
                <span className="text-[var(--color-muted-foreground)]">Using:</span>
                <span className="font-medium text-[var(--color-civic-navy)]">{templateName}</span>
                <a href={templatesUrl} className="text-[var(--color-civic-gold)] hover:underline">
                  Change
                </a>
              </span>
            ) : (
              <a
                href={templatesUrl}
                className="inline-flex items-center gap-1 text-[var(--color-civic-navy)] hover:text-[var(--color-civic-gold)] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <line x1="10" x2="8" y1="9" y2="9" />
                </svg>
                Browse Templates
              </a>
            )}
          </div>
        </div>

        {(needsUserName || needsUserCity) && (
          <div className="mb-6">
            <UserInfoInputs
              onChange={handleUserInfoChange}
              showName={needsUserName}
              showCity={needsUserCity}
            />
          </div>
        )}

        <LetterComposer
          representative={representative}
          initialContent={initialTemplate}
          onContentChange={setLetterContent}
          userInfo={userInfo}
        />

        {letterContent && (
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-civic-navy)]">
              Send Your Letter
            </h3>
            <ContactActions content={substitutedContent} representative={representative} />
          </div>
        )}
      </div>

      {letterContent && (
        <div className="card-civic no-print">
          <h2 className="text-2xl font-bold mb-6 text-[var(--color-civic-navy)]">Print & Mail</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AddressForm onChange={setReturnAddress} />

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-civic-navy)]">
                  Letter Format Options
                </p>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOptions.includeSalutation}
                      onChange={(e) =>
                        setPrintOptions((p) => ({ ...p, includeSalutation: e.target.checked }))
                      }
                      className="rounded border-[var(--color-border)] text-[var(--color-civic-navy)] focus:ring-[var(--color-civic-gold)]"
                    />
                    <span>Add "Dear Representative..." salutation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOptions.includeClosing}
                      onChange={(e) =>
                        setPrintOptions((p) => ({ ...p, includeClosing: e.target.checked }))
                      }
                      className="rounded border-[var(--color-border)] text-[var(--color-civic-navy)] focus:ring-[var(--color-civic-gold)]"
                    />
                    <span>Add "Sincerely," closing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printOptions.includeSignatureLine}
                      onChange={(e) =>
                        setPrintOptions((p) => ({ ...p, includeSignatureLine: e.target.checked }))
                      }
                      className="rounded border-[var(--color-border)] text-[var(--color-civic-navy)] focus:ring-[var(--color-civic-gold)]"
                    />
                    <span>Add signature line</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="btn-civic flex items-center justify-center gap-2 mt-auto"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
                Print & Mail Letter
              </button>
            </div>
          </div>

          <LetterPreview
            letterContent={substitutedContent}
            representative={representative}
            returnAddress={returnAddress}
            printOptions={printOptions}
            className="mt-8"
          />
        </div>
      )}

      {letterContent && (
        <div className="print-only hidden">
          <LetterPreview
            letterContent={substitutedContent}
            representative={representative}
            returnAddress={returnAddress}
            printOptions={printOptions}
          />
        </div>
      )}
    </div>
  );
}
