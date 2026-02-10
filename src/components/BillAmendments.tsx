import { useState, useEffect } from "react";
import { Icon } from "@/components/icons";
import { EmptyState } from "./ui/EmptyState";
import { InlineError } from "./ui/InlineError";
import { cn } from "@/lib/utils";
import { getOrdinalSuffix } from "@/lib/legislator-utils";
import { sanitizeExternalUrl } from "@/lib/url";
import { getAmendmentPageUrl } from "@/lib/amendment-utils";
import type { AmendmentWithRelations } from "@/db/queries/amendments";
import type { AmendmentType } from "@/lib/types/legislation";
import type { BillAmendmentsResponse } from "@/pages/api/legislation/[billId]/amendments";
import { formatDateShort as formatDate } from "@/lib/date-utils";

interface BillAmendmentsProps {
  billId: string;
  className?: string;
}

function AmendmentCard({ amendment }: { amendment: AmendmentWithRelations }) {
  const [expanded, setExpanded] = useState(false);

  const formattedAmendmentNumber = `${amendment.amendmentType.toUpperCase()}.Amdt.${amendment.amendmentNumber}`;
  const detailUrl = getAmendmentPageUrl(
    amendment.amendmentType as AmendmentType,
    amendment.amendmentNumber,
    amendment.congress
  );
  const safeAmendmentUrl = sanitizeExternalUrl(amendment.congressGovUrl);
  const hasDescription = amendment.description && amendment.description.length > 0;
  const hasPurpose = amendment.purpose && amendment.purpose.length > 0;

  const isLong =
    (hasDescription && amendment.description!.length > 200) ||
    (hasPurpose && amendment.purpose!.length > 200);

  const description = hasDescription ? amendment.description : amendment.purpose;
  const truncated =
    description && description.length > 200 ? description.slice(0, 200) + "..." : description;

  return (
    <article className="card-hover">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <a href={detailUrl} className="text-sm font-semibold text-accent hover:underline">
              {formattedAmendmentNumber}
            </a>
            <span className="text-xs text-muted-foreground">
              {amendment.congress}
              {getOrdinalSuffix(amendment.congress)} Congress
            </span>
            <span className="text-xs text-muted-foreground capitalize">{amendment.chamber}</span>
          </div>

          {description && (
            <div className="mb-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {expanded ? description : truncated}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((prev) => !prev)}
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

          {amendment.sponsor && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Sponsored by</span>
              <a
                href={`/rep/${amendment.sponsor.bioguideId}`}
                className="text-sm font-medium text-primary hover:text-accent transition-colors"
              >
                {amendment.sponsor.fullName}
                {amendment.sponsor.party && amendment.sponsor.state && (
                  <span className="text-muted-foreground ml-1">
                    ({amendment.sponsor.party}-{amendment.sponsor.state})
                  </span>
                )}
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {amendment.latestActionDate && (
              <span className="flex items-center gap-1.5">
                <Icon name="calendar" className="w-3.5 h-3.5" />
                {formatDate(amendment.latestActionDate)}
              </span>
            )}
            {amendment.latestActionText && (
              <span className="hidden sm:inline truncate max-w-[250px]">
                {amendment.latestActionText}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <a
              href={detailUrl}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-accent transition-colors"
            >
              View details
              <Icon name="chevron-right" className="w-3.5 h-3.5" />
            </a>
            {safeAmendmentUrl && (
              <a
                href={safeAmendmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-accent transition-colors"
              >
                View on Congress.gov
                <Icon name="external-link" className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border bg-white rounded-sm p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function BillAmendments({ billId, className }: BillAmendmentsProps) {
  const [amendments, setAmendments] = useState<AmendmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAmendments() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/legislation/${billId}/amendments`);

        if (!response.ok) {
          throw new Error("Failed to fetch amendments");
        }

        const data: BillAmendmentsResponse = await response.json();
        setAmendments(data.amendments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAmendments();
  }, [billId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <InlineError title="Unable to load amendments" message={error} />;
  }

  if (amendments.length === 0) {
    return (
      <EmptyState
        icon="file-text"
        title="No Amendments"
        description="There are no amendments to this bill yet. Amendments may be proposed as the bill moves through committees and floor debates."
      />
    );
  }

  return (
    <div
      className={cn(
        "scroll-container-civic max-h-[350px] md:max-h-[500px] relative space-y-4",
        className
      )}
    >
      {amendments.map((amendment) => (
        <AmendmentCard key={amendment.id} amendment={amendment} />
      ))}
    </div>
  );
}
