import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";
import { BILL_TYPE_DISPLAY_NAMES, normalizeBillNumber } from "@/lib/bill-utils";
import { getOrdinalSuffix } from "@/lib/legislator-utils";
import type { BillType } from "@/lib/types/legislation";

const TITLE_TRUNCATE_LENGTH = 80;

interface BillResult {
  id: string;
  billNumber: string;
  billType: BillType;
  congress: number;
  title: string;
}

interface SearchResponse {
  bills: BillResult[];
}

interface BillPickerProps {
  selectedBills: string[];
  onBillsChange: (bills: string[]) => void;
}

function billToDisplayName(bill: BillResult): string {
  return `${BILL_TYPE_DISPLAY_NAMES[bill.billType]}${bill.billNumber}`;
}

function billToNormalized(bill: BillResult): string | null {
  return normalizeBillNumber(billToDisplayName(bill));
}

function truncateTitle(title: string): string {
  if (title.length <= TITLE_TRUNCATE_LENGTH) return title;
  return title.slice(0, TITLE_TRUNCATE_LENGTH) + "\u2026";
}

export function BillPicker({ selectedBills, onBillsChange }: BillPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BillResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/legislation/search?q=${encodeURIComponent(debouncedQuery.trim())}&limit=5`)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data: SearchResponse) => {
        if (!cancelled) {
          setResults(data.bills ?? []);
          setIsOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addBill = useCallback(
    (bill: BillResult) => {
      const normalized = billToNormalized(bill);
      if (!normalized || selectedBills.includes(normalized)) return;
      onBillsChange([...selectedBills, normalized]);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [selectedBills, onBillsChange]
  );

  const removeBill = useCallback(
    (billNumber: string) => {
      onBillsChange(selectedBills.filter((b) => b !== billNumber));
    },
    [selectedBills, onBillsChange]
  );

  return (
    <fieldset className="space-y-2">
      <Label className="text-primary">Linked Legislation (optional)</Label>

      {selectedBills.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="linked-bills">
          {selectedBills.map((bill) => (
            <Badge key={bill} variant="secondary" className="gap-1.5 pr-1">
              {bill}
              <button
                type="button"
                onClick={() => removeBill(bill)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                aria-label={`Remove ${bill}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search bills by number or title..."
          variant="civic"
          data-testid="bill-picker-input"
          autoComplete="off"
        />

        {isLoading && query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-muted-foreground animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {isOpen && results.length > 0 && (
          <ul
            className="absolute z-50 mt-1 w-full bg-white border border-border rounded-sm shadow-lg max-h-60 overflow-auto"
            data-testid="bill-picker-dropdown"
            role="listbox"
          >
            {results.map((bill) => {
              const normalized = billToNormalized(bill);
              const alreadySelected = normalized ? selectedBills.includes(normalized) : false;

              return (
                <li
                  key={bill.id}
                  role="option"
                  aria-selected={alreadySelected}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    alreadySelected
                      ? "opacity-50 cursor-not-allowed bg-secondary/50"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => {
                    if (!alreadySelected) addBill(bill);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-accent shrink-0">
                      {billToDisplayName(bill)}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({bill.congress}
                      {getOrdinalSuffix(bill.congress)})
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {truncateTitle(bill.title)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {isOpen && !isLoading && query.trim() && results.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-sm shadow-lg p-3 text-sm text-muted-foreground">
            No bills found matching &ldquo;{query.trim()}&rdquo;
          </div>
        )}
      </div>
    </fieldset>
  );
}
