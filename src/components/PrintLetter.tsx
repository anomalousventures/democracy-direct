import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TbPrinter } from "react-icons/tb";
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
          <Button variant="default" onClick={handlePrint}>
            <TbPrinter className="size-4" aria-hidden="true" />
            Print & Mail Letter
          </Button>
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
