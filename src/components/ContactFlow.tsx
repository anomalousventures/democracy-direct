import { useState, useCallback } from "react";
import { LetterComposer } from "./LetterComposer";
import { ContactActions } from "./ContactActions";
import { AddressForm } from "./AddressForm";
import { LetterPreview } from "./LetterPreview";
import { type Representative, type Address, createEmptyAddress } from "../types/representative";

interface ContactFlowProps {
  representative: Representative;
}

export function ContactFlow({ representative }: ContactFlowProps) {
  const [letterContent, setLetterContent] = useState("");
  const [returnAddress, setReturnAddress] = useState<Address>(createEmptyAddress);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-8">
      <div className="card-civic">
        <h2 className="text-2xl font-bold mb-6 text-[var(--color-civic-navy)]">
          Write Your Letter
        </h2>

        <LetterComposer representative={representative} onContentChange={setLetterContent} />

        {letterContent && (
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-civic-navy)]">
              Send Your Letter
            </h3>
            <ContactActions content={letterContent} representative={representative} />
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
            letterContent={letterContent}
            representative={representative}
            returnAddress={returnAddress}
            className="mt-8"
          />
        </div>
      )}
    </div>
  );
}
