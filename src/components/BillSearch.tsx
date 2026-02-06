import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Toggle } from "./ui/toggle";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { BillCard } from "./BillCard";
import { useDebounce } from "@/hooks/useDebounce";
import type { BillWithSponsor } from "@/db/queries/bills";
import type { BillStatus, BillType } from "@/lib/types/legislation";
import { getOrdinalSuffix } from "@/lib/legislator-utils";

interface SearchResponse {
  bills: BillWithSponsor[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
    total: number;
  };
  availableSubjects: string[];
}

const BILL_TYPES: { value: BillType; label: string }[] = [
  { value: "hr", label: "H.R." },
  { value: "s", label: "S." },
  { value: "hjres", label: "H.J.Res." },
  { value: "sjres", label: "S.J.Res." },
  { value: "hres", label: "H.Res." },
  { value: "sres", label: "S.Res." },
];

const BILL_STATUSES: { value: BillStatus; label: string }[] = [
  { value: "introduced", label: "Introduced" },
  { value: "passed_house", label: "Passed House" },
  { value: "passed_senate", label: "Passed Senate" },
  { value: "became_law", label: "Became Law" },
];

function BillCardSkeleton() {
  return (
    <div className="border border-border bg-white rounded-sm p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function BillSearch() {
  const [bills, setBills] = useState<BillWithSponsor[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [congress, setCongress] = useState<number | null>(119);
  const [selectedTypes, setSelectedTypes] = useState<BillType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<BillStatus[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const isInitialMount = useRef(true);

  const fetchBills = useCallback(
    async (newOffset = 0, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("offset", String(newOffset));

      if (debouncedSearch.trim()) {
        params.set("q", debouncedSearch.trim());
      }

      if (congress) {
        params.set("congress", String(congress));
      }

      if (selectedTypes.length === 1) {
        params.set("type", selectedTypes[0]);
      }

      if (selectedStatuses.length === 1) {
        params.set("status", selectedStatuses[0]);
      }

      if (selectedSubjects.length === 1) {
        params.set("subject", selectedSubjects[0]);
      }

      try {
        const response = await fetch(`/api/bills/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch bills");
        }

        const data: SearchResponse = await response.json();

        let filteredBills = data.bills;
        if (selectedTypes.length > 1) {
          filteredBills = filteredBills.filter((b) =>
            selectedTypes.includes(b.billType as BillType)
          );
        }
        if (selectedStatuses.length > 1) {
          filteredBills = filteredBills.filter((b) =>
            selectedStatuses.includes(b.status as BillStatus)
          );
        }
        if (selectedSubjects.length > 1) {
          filteredBills = filteredBills.filter((b) =>
            b.subjects?.some((s) => selectedSubjects.includes(s))
          );
        }

        if (append) {
          setBills((prev) => [...prev, ...filteredBills]);
        } else {
          setBills(filteredBills);
        }

        setOffset(newOffset);
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        setAvailableSubjects(data.availableSubjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, congress, selectedTypes, selectedStatuses, selectedSubjects]
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchBills();
      return;
    }
    fetchBills();
  }, [debouncedSearch, congress, selectedTypes, selectedStatuses, selectedSubjects, fetchBills]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleType = useCallback((type: BillType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const toggleStatus = useCallback((status: BillStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchBills(offset + 20, true);
    }
  }, [hasMore, isLoadingMore, offset, fetchBills]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedSubjects([]);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedTypes.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedSubjects.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search by bill number or title..."
          value={searchQuery}
          onChange={handleSearchChange}
          variant="civic"
          className="pl-12"
          aria-label="Search bills"
          data-testid="bill-search-input"
        />
        {isLoading && searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
            <LoadingSpinner className="h-5 w-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {[119, 118, 117].map((c) => (
          <Toggle
            key={c}
            variant="outline"
            size="sm"
            pressed={congress === c}
            onPressedChange={() => setCongress(congress === c ? null : c)}
            className="px-3 py-1.5 text-sm font-medium rounded-sm border border-border bg-white transition-all duration-200 hover:border-primary/50 hover:bg-secondary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:shadow-sm"
          >
            {c}
            {getOrdinalSuffix(c)}
          </Toggle>
        ))}

        <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

        <div className="flex flex-wrap gap-2" data-testid="type-filter">
          {BILL_TYPES.map(({ value, label }) => (
            <Toggle
              key={value}
              variant="outline"
              size="sm"
              pressed={selectedTypes.includes(value)}
              onPressedChange={() => toggleType(value)}
              className="px-3 py-1.5 text-sm font-medium rounded-sm border border-border bg-white transition-all duration-200 hover:border-primary/50 hover:bg-secondary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:shadow-sm"
            >
              {label}
            </Toggle>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

        <div className="flex flex-wrap gap-2" data-testid="status-filter">
          {BILL_STATUSES.map(({ value, label }) => (
            <Toggle
              key={value}
              variant="outline"
              size="sm"
              pressed={selectedStatuses.includes(value)}
              onPressedChange={() => toggleStatus(value)}
              className="px-3 py-1.5 text-sm font-medium rounded-sm border border-border bg-white transition-all duration-200 hover:border-primary/50 hover:bg-secondary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:shadow-sm"
            >
              {label}
            </Toggle>
          ))}
        </div>
      </div>

      {/* Topic Filter */}
      {availableSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="subject-filter">
          {availableSubjects.slice(0, 12).map((subject) => (
            <Toggle
              key={subject}
              variant="outline"
              size="sm"
              pressed={selectedSubjects.includes(subject)}
              onPressedChange={() => toggleSubject(subject)}
              className="px-3 py-1.5 text-sm font-medium rounded-sm border border-border bg-white transition-all duration-200 hover:border-primary/50 hover:bg-secondary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:shadow-sm"
            >
              {subject}
            </Toggle>
          ))}
        </div>
      )}

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between py-3 px-4 bg-secondary/50 border border-border rounded-sm">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Searching..."
            ) : (
              <>
                <span className="font-semibold text-primary">{total}</span>{" "}
                {total === 1 ? "bill" : "bills"} found
                {hasMore && !isLoading && " (scroll for more)"}
              </>
            )}
          </p>
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:text-accent font-medium transition-colors"
            aria-label="Clear all filters"
            data-testid="clear-filters-button"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="p-4 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-sm"
          role="alert"
        >
          <p className="font-medium">Unable to load bills</p>
          <p className="mt-1 text-destructive/80">{error}</p>
          <button
            onClick={() => fetchBills()}
            className="mt-3 text-sm font-medium underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      <div data-testid="bill-search-results" className="space-y-4">
        {isLoading && !bills.length ? (
          <>
            <BillCardSkeleton />
            <BillCardSkeleton />
            <BillCardSkeleton />
          </>
        ) : bills.length > 0 ? (
          <>
            {bills.map((bill, index) => (
              <div
                key={bill.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                <BillCard bill={bill} showSponsor={true} />
              </div>
            ))}

            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="civicSecondary"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-w-[200px]"
                  data-testid="load-more-button"
                >
                  {isLoadingMore ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More Bills"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : !error ? (
          <div
            className="text-center py-16 px-8 bg-secondary/30 border border-border rounded-sm"
            data-testid="no-results"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground text-lg">
              {hasActiveFilters ? "No bills match your search." : "No bills available yet."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-primary hover:text-accent font-medium transition-colors"
              >
                Clear filters and show all
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
