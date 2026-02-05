import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Bill } from "@/db/schema";
import type { BillStatus } from "@/lib/types/legislation";
import { BILL_TYPE_DISPLAY_NAMES } from "@/lib/bill-utils";
import type { BillType } from "@/lib/types/legislation";

export interface SponsoredBillsProps {
  bills: Bill[];
  totalCount: number;
  bioguideId: string;
  className?: string;
}

type StatusStyle = {
  label: string;
  bg: string;
  text: string;
  border: string;
};

const STATUS_STYLES: Record<BillStatus, StatusStyle> = {
  introduced: {
    label: "Introduced",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  passed_house: {
    label: "Passed House",
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  passed_senate: {
    label: "Passed Senate",
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  resolving_differences: {
    label: "In Conference",
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  to_president: {
    label: "To President",
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  signed: {
    label: "Signed",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  vetoed: {
    label: "Vetoed",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
  veto_overridden: {
    label: "Veto Overridden",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  became_law: {
    label: "Became Law",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: BillStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-sm",
        style.bg,
        style.text,
        style.border
      )}
    >
      {style.label}
    </span>
  );
}

interface BillStatsBarProps {
  bills: Bill[];
  totalCount: number;
  isSticky?: boolean;
  isScrolled?: boolean;
}

function BillStatsBar({
  bills,
  totalCount,
  isSticky = false,
  isScrolled = false,
}: BillStatsBarProps) {
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const bill of bills) {
      counts[bill.status] = (counts[bill.status] || 0) + 1;
    }
    return counts;
  }, [bills]);

  const passedCount =
    (statusCounts["passed_house"] || 0) +
    (statusCounts["passed_senate"] || 0) +
    (statusCounts["to_president"] || 0) +
    (statusCounts["signed"] || 0) +
    (statusCounts["became_law"] || 0) +
    (statusCounts["veto_overridden"] || 0);

  return (
    <div
      className={cn(
        "p-4 bg-secondary border border-border rounded-sm transition-shadow duration-200",
        isSticky && "sticky top-0 z-10",
        isScrolled && "shadow-lg"
      )}
    >
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-primary">{totalCount}</span>
          <span className="text-muted-foreground">bills sponsored</span>
        </div>
        {passedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{passedCount}</span> advanced
            </span>
          </div>
        )}
        {statusCounts["became_law"] > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{statusCounts["became_law"]}</span>{" "}
              became law
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function BillCard({ bill }: { bill: Bill }) {
  const [expanded, setExpanded] = useState(false);
  const displayNumber = `${BILL_TYPE_DISPLAY_NAMES[bill.billType as BillType]}${bill.billNumber}`;

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  const hasSummary = bill.summary && bill.summary.length > 0;
  const truncatedSummary =
    hasSummary && bill.summary!.length > 200 ? bill.summary!.slice(0, 200) + "..." : bill.summary;

  return (
    <article className="group relative border border-border bg-white rounded-sm p-4 hover:shadow-[var(--shadow-civic)] transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-accent">{displayNumber}</span>
            <StatusBadge status={bill.status as BillStatus} />
            <span className="text-xs text-muted-foreground">{bill.congress}th Congress</span>
          </div>

          {bill.congressGovUrl ? (
            <a
              href={bill.congressGovUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-medium text-primary hover:text-accent transition-colors line-clamp-2 mb-2"
            >
              {bill.title}
              <Icon name="external-link" className="inline-block w-3.5 h-3.5 ml-1.5 opacity-60" />
            </a>
          ) : (
            <p className="block font-medium text-primary line-clamp-2 mb-2">{bill.title}</p>
          )}

          {hasSummary && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {expanded ? bill.summary : truncatedSummary}
              </p>
              {bill.summary!.length > 200 && (
                <button
                  onClick={toggleExpand}
                  className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:text-accent transition-colors"
                >
                  <Icon
                    name="chevron-down"
                    className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")}
                  />
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icon name="calendar" className="w-3.5 h-3.5" />
              Introduced {formatDate(bill.introducedDate)}
            </span>
            {bill.latestActionText && (
              <span className="hidden sm:inline text-muted-foreground/80 truncate max-w-[250px]">
                Latest: {bill.latestActionText}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="icon-box-accent mx-auto mb-4">
        <Icon name="file-text" className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">No Sponsored Bills</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        This representative hasn't sponsored any bills yet. Check back later as legislative data is
        updated regularly.
      </p>
    </div>
  );
}

export function SponsoredBills({ bills, totalCount, className }: SponsoredBillsProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const visibleBills = useMemo(() => bills.slice(0, displayCount), [bills, displayCount]);

  const hasMore = bills.length > displayCount;

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 10);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 0);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  if (bills.length === 0) {
    return (
      <div className={cn("animate-fade-up", className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className={cn("scroll-container-civic max-h-[350px] md:max-h-[500px] relative", className)}
      data-testid="sponsored-bills-scroll-container"
    >
      <BillStatsBar bills={bills} totalCount={totalCount} isSticky={true} isScrolled={isScrolled} />

      <div className="space-y-3 pt-4">
        {visibleBills.map((bill, index) => (
          <div
            key={bill.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
          >
            <BillCard bill={bill} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={handleLoadMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary border-2 border-primary rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Load More Bills
            <span className="text-muted-foreground">({bills.length - displayCount} remaining)</span>
          </button>
        </div>
      )}
    </div>
  );
}
