import { useMemo, useState, useCallback } from "react";
import { EmptyState } from "./ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Bill } from "@/db/schema";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { BillCard } from "@/components/BillCard";

export interface SponsoredBillsProps {
  bills: Bill[];
  totalCount: number;
  className?: string;
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

export function SponsoredBills({ bills, totalCount, className }: SponsoredBillsProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const { ref: scrollContainerRef, isScrolled } = useScrollShadow();

  const visibleBills = useMemo(() => bills.slice(0, displayCount), [bills, displayCount]);

  const hasMore = bills.length > displayCount;

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 10);
  }, []);

  if (bills.length === 0) {
    return (
      <div className={cn("animate-fade-up", className)}>
        <EmptyState
          icon="file-text"
          title="No Sponsored Bills"
          description="This representative hasn't sponsored any bills yet. Check back later as legislative data is updated regularly."
        />
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
            type="button"
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
