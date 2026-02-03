import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { SenderInfoForm, type SenderInfo, createEmptySenderInfo } from "./SenderInfoForm";
import { LetterPreview, type PrintOptions } from "./LetterPreview";
import { type Representative } from "../types/representative";
import { useAnalytics } from "@/hooks/useAnalytics";

const printLetterOptions: PrintOptions = {
  includeReturnAddress: true,
  includeDate: true,
  includeRecipientAddress: true,
  includeSalutation: true,
  includeClosing: true,
  includeSignatureLine: true,
};

interface PrintLetterProps {
  letterContent: string;
  representative: Representative;
  bioguideId?: string;
}

export function PrintLetter({ letterContent, representative, bioguideId }: PrintLetterProps) {
  const [senderInfo, setSenderInfo] = useState<SenderInfo>(createEmptySenderInfo);
  const { capture } = useAnalytics();
  const repName = `${representative.first_name} ${representative.last_name}`;

  const handlePrint = useCallback(() => {
    capture("letter_printed", { repBioguideId: bioguideId, repName });
    window.print();
  }, [capture, bioguideId, repName]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SenderInfoForm onChange={setSenderInfo} />

        <div className="flex flex-col justify-end">
          <Button variant="default" onClick={handlePrint}>
            <Icon name="printer" className="size-4" aria-hidden="true" />
            Print & Mail Letter
          </Button>
        </div>
      </div>

      <LetterPreview
        letterContent={letterContent}
        representative={representative}
        returnAddress={senderInfo}
        printOptions={printLetterOptions}
        className="min-h-[500px]"
      />
    </div>
  );
}
