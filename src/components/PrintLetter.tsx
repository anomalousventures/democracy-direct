import { useState, useCallback } from "react";

export interface Representative {
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  district: string | null;
  chamber: "senate" | "house";
  office_address?: string;
}

interface PrintLetterProps {
  letterContent: string;
  representative: Representative;
}

interface ReturnAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

const getTitle = (rep: Representative): string => {
  return rep.chamber === "senate" ? "Senator" : "Representative";
};

const formatDate = (): string => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function PrintLetter({ letterContent, representative }: PrintLetterProps) {
  const [returnAddress, setReturnAddress] = useState<ReturnAddress>({
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleAddressChange = useCallback(
    (field: keyof ReturnAddress) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setReturnAddress((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    },
    []
  );

  const repTitle = getTitle(representative);
  const addressLines = representative.office_address?.split("\n") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-civic-navy)]">
            Your Return Address
          </h3>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="return-name"
                className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
              >
                Your Name
              </label>
              <input
                id="return-name"
                type="text"
                value={returnAddress.name}
                onChange={handleAddressChange("name")}
                className="input-civic"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label
                htmlFor="return-street"
                className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
              >
                Street Address
              </label>
              <input
                id="return-street"
                type="text"
                value={returnAddress.street}
                onChange={handleAddressChange("street")}
                className="input-civic"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="return-city"
                  className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
                >
                  City
                </label>
                <input
                  id="return-city"
                  type="text"
                  value={returnAddress.city}
                  onChange={handleAddressChange("city")}
                  className="input-civic"
                  placeholder="City"
                />
              </div>
              <div>
                <label
                  htmlFor="return-state"
                  className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
                >
                  State
                </label>
                <input
                  id="return-state"
                  type="text"
                  value={returnAddress.state}
                  onChange={handleAddressChange("state")}
                  className="input-civic"
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
              <div>
                <label
                  htmlFor="return-zip"
                  className="block text-sm font-medium text-[var(--color-civic-navy)] mb-1"
                >
                  ZIP
                </label>
                <input
                  id="return-zip"
                  type="text"
                  value={returnAddress.zip}
                  onChange={handleAddressChange("zip")}
                  className="input-civic"
                  placeholder="12345"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>

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
        className="print-preview bg-white border border-[var(--color-border)] p-8 min-h-[500px] font-serif"
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
  );
}
