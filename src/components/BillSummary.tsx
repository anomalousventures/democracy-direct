import { useState, useCallback } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { BillWithSponsor } from "@/db/queries/bills";

interface BillSummaryProps {
  bill: BillWithSponsor;
  className?: string;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function BillSummary({ bill, className }: BillSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  const hasSummary = bill.summary && bill.summary.length > 0;
  const isLongSummary = hasSummary && bill.summary!.length > 500;
  const truncatedSummary = isLongSummary ? bill.summary!.slice(0, 500) + "..." : bill.summary;

  const sponsorInitials = bill.sponsorName
    ? bill.sponsorName
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <div className={cn("space-y-6", className)}>
      {hasSummary ? (
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold text-primary mb-3 border-l-4 border-accent pl-3">
            Bill Summary
          </h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {expanded ? bill.summary : truncatedSummary}
          </p>
          {isLongSummary && (
            <button
              onClick={toggleExpand}
              className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:text-accent transition-colors font-medium"
            >
              <Icon
                name="chevron-down"
                className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")}
              />
              {expanded ? "Show less" : "Read full summary"}
            </button>
          )}
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold text-primary mb-3 border-l-4 border-accent pl-3">
            Bill Summary
          </h3>
          <p className="text-muted-foreground italic">No summary available for this bill yet.</p>
        </div>
      )}

      {bill.sponsorBioguideId && (
        <div className="flex items-center gap-3 p-4 bg-secondary/50 border border-border rounded-sm">
          <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-muted flex-shrink-0">
            <div className="rep-photo-fallback-sm !text-2xl">{sponsorInitials}</div>
            <img
              src={`https://theunitedstates.io/images/congress/225x275/${bill.sponsorBioguideId}.jpg`}
              alt={bill.sponsorName || "Sponsor"}
              className="absolute inset-0 w-full h-full object-cover object-top"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sponsored by</p>
            <a
              href={`/rep/${bill.sponsorBioguideId}`}
              className="font-medium text-primary hover:text-accent transition-colors"
            >
              {bill.sponsorName}
              {bill.sponsorParty && bill.sponsorState && (
                <span className="text-muted-foreground ml-1">
                  ({bill.sponsorParty}-{bill.sponsorState})
                </span>
              )}
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-secondary/30 border border-border rounded-sm">
          <p className="text-sm text-muted-foreground mb-1">Introduced</p>
          <p className="font-medium text-primary">{formatDate(bill.introducedDate)}</p>
        </div>

        {bill.latestActionDate && (
          <div className="p-4 bg-secondary/30 border border-border rounded-sm">
            <p className="text-sm text-muted-foreground mb-1">Latest Action</p>
            <p className="font-medium text-primary">{formatDate(bill.latestActionDate)}</p>
          </div>
        )}
      </div>

      {bill.latestActionText && (
        <div className="p-4 bg-secondary/30 border border-border rounded-sm">
          <p className="text-sm text-muted-foreground mb-1">Latest Action Details</p>
          <p className="text-primary">{bill.latestActionText}</p>
        </div>
      )}

      {bill.subjects && bill.subjects.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {bill.subjects.map((subject) => (
              <span
                key={subject}
                className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-sm text-muted-foreground"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}

      {bill.congressGovUrl && (
        <div className="pt-4 border-t border-border">
          <a
            href={bill.congressGovUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors font-medium"
          >
            View on Congress.gov
            <Icon name="external-link" className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
