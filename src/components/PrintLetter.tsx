import { useState, useCallback } from "react";
import { AddressForm } from "./AddressForm";
import { LetterPreview } from "./LetterPreview";
import { type Representative, type Address, createEmptyAddress } from "../types/representative";

interface PrintLetterProps {
  letterContent: string;
  representative: Representative;
}

export function PrintLetter({ letterContent, representative }: PrintLetterProps) {
  const [returnAddress, setReturnAddress] = useState<Address>(createEmptyAddress);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        className="min-h-[500px]"
      />
    </div>
  );
}
