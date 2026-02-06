import { useState, useCallback } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { BillStatus, BillType } from "@/lib/types/legislation";
import { BILL_TYPE_DISPLAY_NAMES, getBillPageUrl } from "@/lib/bill-utils";
import { getOrdinalSuffix } from "@/lib/legislator-utils";
import type { BillWithSponsor } from "@/db/queries/bills";

export interface BillCardProps {
  bill: BillWithSponsor;
  showSponsor?: boolean;
  className?: string;
}

type StatusStyle = {
  label: string;
  bg: string;
  text: string;
  border: string;
};

export const STATUS_STYLES: Record<BillStatus, StatusStyle> = {
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
    timeZone: "UTC",
  });
}

export function StatusBadge({ status }: { status: BillStatus }) {
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

export function BillCard({ bill, showSponsor = false, className }: BillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const displayNumber = `${BILL_TYPE_DISPLAY_NAMES[bill.billType as BillType]}${bill.billNumber}`;
  const billPageUrl = getBillPageUrl(bill.billType as BillType, bill.billNumber, bill.congress);

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  const hasSummary = bill.summary && bill.summary.length > 0;
  const truncatedSummary =
    hasSummary && bill.summary!.length > 200 ? bill.summary!.slice(0, 200) + "..." : bill.summary;

  return (
    <article
      data-testid="bill-card"
      className={cn(
        "group relative border border-border bg-white rounded-sm p-4 hover:shadow-[var(--shadow-civic)] transition-shadow duration-200",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-accent">{displayNumber}</span>
            <StatusBadge status={bill.status as BillStatus} />
            <span className="text-xs text-muted-foreground">
              {bill.congress}
              {getOrdinalSuffix(bill.congress)} Congress
            </span>
          </div>

          <a
            href={billPageUrl}
            className="block font-medium text-primary hover:text-accent transition-colors line-clamp-2 mb-2"
          >
            {bill.title}
          </a>

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

          {showSponsor && bill.sponsorBioguideId && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <a
                href={`/rep/${bill.sponsorBioguideId}`}
                className="text-sm text-primary hover:text-accent transition-colors"
              >
                {bill.sponsorName}
                {bill.sponsorParty && bill.sponsorState && (
                  <span className="text-muted-foreground ml-1">
                    ({bill.sponsorParty}-{bill.sponsorState})
                  </span>
                )}
              </a>
            </div>
          )}

          {bill.congressGovUrl && (
            <div className="mt-3">
              <a
                href={bill.congressGovUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Congress.gov
                <Icon name="external-link" className="w-3 h-3 opacity-60" />
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
