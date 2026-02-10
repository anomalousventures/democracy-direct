import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Toggle } from "./ui/toggle";
import { Skeleton } from "./ui/skeleton";
import { Icon } from "@/components/icons";
import { Spinner } from "./ui/Spinner";
import { InlineError } from "./ui/InlineError";
import { EmptyState } from "./ui/EmptyState";
import { LoadMoreButton } from "./ui/LoadMoreButton";
import { BillCard } from "./BillCard";
import { useDebounce } from "@/hooks/useDebounce";
import type { BillWithSponsor } from "@/db/queries/bills";
import type { BillStatus, BillType } from "@/lib/types/legislation";
import { isValidBillType } from "@/lib/bill-utils";
import { getCurrentCongress } from "@/lib/congress-api";
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

const VALID_STATUSES = new Set<string>(BILL_STATUSES.map((s) => s.value));

const DEFAULT_CONGRESS = getCurrentCongress();

interface SearchState {
  q: string;
  congress: number | null | undefined;
  types: BillType[];
  statuses: BillStatus[];
  subjects: string[];
}

export function parseSearchParams(search: string): SearchState {
  const params = new URLSearchParams(search);

  const q = params.get("q")?.trim() ?? "";

  const congressStr = params.get("congress");
  let congress: number | null | undefined = undefined;
  if (congressStr === "all") {
    congress = null;
  } else if (congressStr) {
    const parsed = parseInt(congressStr, 10);
    if (!isNaN(parsed) && parsed > 0) congress = parsed;
  }

  const typeStr = params.get("type") ?? "";
  const types = typeStr
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(isValidBillType);

  const statusStr = params.get("status") ?? "";
  const statuses = statusStr
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is BillStatus => s !== "" && VALID_STATUSES.has(s));

  const subjectStr = params.get("subject") ?? "";
  const subjects = subjectStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { q, congress, types, statuses, subjects };
}

export function serializeSearchParams(state: SearchState): string {
  const params = new URLSearchParams();

  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.congress === null) {
    params.set("congress", "all");
  } else if (state.congress !== undefined && state.congress !== DEFAULT_CONGRESS) {
    params.set("congress", String(state.congress));
  }
  if (state.types.length > 0) params.set("type", state.types.join(","));
  if (state.statuses.length > 0) params.set("status", state.statuses.join(","));
  if (state.subjects.length > 0) params.set("subject", state.subjects.join(","));

  return params.toString();
}

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

export function BillSearch() {
  const [bills, setBills] = useState<BillWithSponsor[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [congress, setCongress] = useState<number | null>(DEFAULT_CONGRESS);
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

  useEffect(() => {
    const parsed = parseSearchParams(window.location.search);
    const hasUrlParams =
      parsed.q ||
      parsed.congress !== undefined ||
      parsed.types.length > 0 ||
      parsed.statuses.length > 0 ||
      parsed.subjects.length > 0;

    if (hasUrlParams) {
      setSearchQuery(parsed.q);
      setCongress(parsed.congress !== undefined ? parsed.congress : DEFAULT_CONGRESS);
      setSelectedTypes(parsed.types);
      setSelectedStatuses(parsed.statuses);
      setSelectedSubjects(parsed.subjects);
    }

    isInitialMount.current = false;

    if (!hasUrlParams) {
      fetchBills();
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) return;
    const serialized = serializeSearchParams({
      q: debouncedSearch,
      congress,
      types: selectedTypes,
      statuses: selectedStatuses,
      subjects: selectedSubjects,
    });
    const newUrl = serialized ? `/legislation?${serialized}` : "/legislation";
    if (window.location.pathname + window.location.search !== newUrl) {
      history.replaceState(null, "", newUrl);
    }
  }, [debouncedSearch, congress, selectedTypes, selectedStatuses, selectedSubjects]);

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

      if (congress === null) {
        params.set("congress", "all");
      } else if (congress && congress !== DEFAULT_CONGRESS) {
        params.set("congress", String(congress));
      }

      if (selectedTypes.length > 0) {
        params.set("type", selectedTypes.join(","));
      }

      if (selectedStatuses.length > 0) {
        params.set("status", selectedStatuses.join(","));
      }

      if (selectedSubjects.length > 0) {
        params.set("subject", selectedSubjects.join(","));
      }

      try {
        const response = await fetch(`/api/legislation/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch bills");
        }

        const data: SearchResponse = await response.json();

        if (append) {
          setBills((prev) => [...prev, ...data.bills]);
        } else {
          setBills(data.bills);
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
    if (isInitialMount.current) return;
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
    setCongress(DEFAULT_CONGRESS);
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedSubjects([]);
  }, []);

  const hasActiveFilters =
    !!searchQuery.trim() ||
    congress !== DEFAULT_CONGRESS ||
    selectedTypes.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedSubjects.length > 0;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Icon name="search" className="h-5 w-5 text-muted-foreground" />
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
            <Spinner className="h-5 w-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          key="all"
          variant="filter"
          pressed={congress === null}
          onPressedChange={() => setCongress(congress === null ? DEFAULT_CONGRESS : null)}
        >
          All
        </Toggle>
        {Array.from({ length: 3 }, (_, i) => DEFAULT_CONGRESS - i).map((c) => (
          <Toggle
            key={c}
            variant="filter"
            pressed={congress === c}
            onPressedChange={() => setCongress(congress === c ? null : c)}
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
              variant="filter"
              pressed={selectedTypes.includes(value)}
              onPressedChange={() => toggleType(value)}
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
              variant="filter"
              pressed={selectedStatuses.includes(value)}
              onPressedChange={() => toggleStatus(value)}
            >
              {label}
            </Toggle>
          ))}
        </div>
      </div>

      {availableSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="subject-filter">
          {availableSubjects.slice(0, 12).map((subject) => (
            <Toggle
              key={subject}
              variant="filter"
              pressed={selectedSubjects.includes(subject)}
              onPressedChange={() => toggleSubject(subject)}
            >
              {subject}
            </Toggle>
          ))}
        </div>
      )}

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

      {error && (
        <InlineError title="Unable to load bills" message={error} onRetry={() => fetchBills()} />
      )}

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
              <LoadMoreButton
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
                label="Load More Bills"
              />
            )}
          </>
        ) : !error ? (
          <div data-testid="no-results">
            <EmptyState
              icon="search"
              title={hasActiveFilters ? "No bills match your search." : "No bills available yet."}
              description={
                hasActiveFilters
                  ? "Try adjusting your filters or search terms."
                  : "Bills will appear here once data is available."
              }
              bordered
            >
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-primary hover:text-accent font-medium transition-colors"
                >
                  Clear filters and show all
                </button>
              )}
            </EmptyState>
          </div>
        ) : null}
      </div>
    </div>
  );
}
