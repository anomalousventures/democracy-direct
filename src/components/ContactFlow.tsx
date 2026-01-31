import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TbFileText, TbPrinter } from "react-icons/tb";
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
      <div className="card-civic-lg no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-primary">Write Your Letter</h2>
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
                <TbFileText className="size-4" aria-hidden="true" />
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
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-4 text-primary">Send Your Letter</h3>
            <ContactActions content={substitutedContent} representative={representative} />
          </div>
        )}
      </div>

      {letterContent && (
        <div className="card-civic-lg no-print">
          <h2 className="text-2xl font-bold mb-6 text-primary">Print & Mail</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AddressForm onChange={setReturnAddress} />

            <div className="flex flex-col gap-4">
              <fieldset className="space-y-3">
                <legend className="sr-only">Letter Format Options</legend>
                <p className="text-sm font-medium text-primary" aria-hidden="true">
                  Letter Format Options
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="salutation"
                      checked={printOptions.includeSalutation}
                      onCheckedChange={(checked) =>
                        setPrintOptions((p) => ({ ...p, includeSalutation: checked === true }))
                      }
                    />
                    <Label htmlFor="salutation" className="text-sm cursor-pointer">
                      Add "Dear Representative..." salutation
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
                      Add "Sincerely," closing
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
                      Add signature line
                    </Label>
                  </div>
                </div>
              </fieldset>

              <Button variant="default" onClick={handlePrint} className="mt-auto">
                <TbPrinter className="size-4" aria-hidden="true" />
                Print & Mail Letter
              </Button>
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
