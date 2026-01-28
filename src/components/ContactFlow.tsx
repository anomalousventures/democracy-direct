import { useState, useCallback } from "react";
import { LetterComposer, type Representative as ComposerRep } from "./LetterComposer";
import { ContactActions, type Representative as ContactRep } from "./ContactActions";
import { AddressForm, type Address } from "./AddressForm";

export interface Representative {
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  district: string | null;
  chamber: "senate" | "house";
  contact_form?: string;
  phone?: string;
  office_address?: string;
}

interface ContactFlowProps {
  representative: Representative;
}

const formatDate = (): string => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getTitle = (rep: Representative): string => {
  return rep.chamber === "senate" ? "Senator" : "Representative";
};

export function ContactFlow({ representative }: ContactFlowProps) {
  const [letterContent, setLetterContent] = useState("");
  const [returnAddress, setReturnAddress] = useState<Address>({
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const repTitle = getTitle(representative);
  const addressLines = representative.office_address?.split("\n") || [];

  return (
    <div className="space-y-8">
      <div className="card-civic">
        <h2 className="text-2xl font-bold mb-6 text-[var(--color-civic-navy)]">
          Write Your Letter
        </h2>

        <LetterComposer
          representative={representative as ComposerRep}
          onContentChange={setLetterContent}
        />

        {letterContent && (
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-civic-navy)]">
              Send Your Letter
            </h3>
            <ContactActions content={letterContent} representative={representative as ContactRep} />
          </div>
        )}
      </div>

      {letterContent && (
        <div className="card-civic no-print">
          <h2 className="text-2xl font-bold mb-6 text-[var(--color-civic-navy)]">Print & Mail</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AddressForm onChange={setReturnAddress} />

            <div className="flex flex-col justify-end">
              <button
                onClick={handlePrint}
                className="btn-civic flex items-center justify-center gap-2"
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
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
                Print & Mail Letter
              </button>
            </div>
          </div>

          <div
            data-testid="print-preview"
            className="print-preview mt-8 bg-white border border-[var(--color-border)] p-8 min-h-[400px] font-serif"
          >
            <div className="space-y-6">
              {(returnAddress.name || returnAddress.street || returnAddress.city) && (
                <div className="text-sm">
                  {returnAddress.name && <div>{returnAddress.name}</div>}
                  {returnAddress.street && <div>{returnAddress.street}</div>}
                  {(returnAddress.city || returnAddress.state || returnAddress.zip) && (
                    <div>
                      {returnAddress.city}
                      {returnAddress.city && returnAddress.state && ", "}
                      {returnAddress.state} {returnAddress.zip}
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm">{formatDate()}</div>

              <div className="text-sm">
                <div>
                  {repTitle} {representative.first_name} {representative.last_name}
                </div>
                {addressLines.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>

              <div className="text-sm">
                Dear {repTitle} {representative.last_name},
              </div>

              <div className="text-sm whitespace-pre-wrap leading-relaxed">{letterContent}</div>

              <div className="text-sm space-y-8">
                <div>Sincerely,</div>
                <div className="border-b border-gray-400 w-48">&nbsp;</div>
                {returnAddress.name && <div>{returnAddress.name}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
