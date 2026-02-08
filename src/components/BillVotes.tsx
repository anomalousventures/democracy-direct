import { useState, useEffect, useId } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { BillVotesResponse, BillVoteSummary } from "@/pages/api/legislation/[billId]/votes";
import { VoteSummaryCard } from "@/components/vote/VoteSummaryCard";
import { useScrollShadow } from "@/hooks/useScrollShadow";

interface BillVotesProps {
  billId: string;
  className?: string;
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border bg-white rounded-sm p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="icon-box-accent mx-auto mb-4">
        <Icon name="gavel" className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">No Roll Call Votes</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        There are no recorded roll call votes for this bill yet. Votes will appear here once the
        bill advances through the legislative process.
      </p>
    </div>
  );
}

function VoteListSection({ votes, label }: { votes: BillVoteSummary[]; label: string }) {
  const { ref, isScrolled } = useScrollShadow();

  return (
    <div ref={ref} className="scroll-container-civic max-h-[350px] md:max-h-[500px] relative">
      <div
        className={cn(
          "p-3 bg-secondary border border-border rounded-sm transition-shadow duration-200 sticky top-0 z-10",
          isScrolled && "shadow-lg"
        )}
      >
        <span className="text-sm font-medium text-primary">
          {votes.length} {label}
        </span>
      </div>

      <div className="space-y-3 pt-4">
        {votes.map((vote, index) => (
          <div
            key={vote.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
          >
            <VoteSummaryCard vote={vote} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AmendmentVotesSection({ votes }: { votes: BillVoteSummary[] }) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);

  if (votes.length === 0) return null;

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full p-3 bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-between"
      >
        <span className="text-sm font-medium text-primary">Amendment Votes ({votes.length})</span>
        <Icon
          name="chevron-down"
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div id={panelId} className="p-4">
          <VoteListSection votes={votes} label="Amendment Roll Call Votes" />
        </div>
      )}
    </div>
  );
}

export function BillVotes({ billId, className }: BillVotesProps) {
  const [billVotes, setBillVotes] = useState<BillVoteSummary[]>([]);
  const [amendmentVotes, setAmendmentVotes] = useState<BillVoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVotes() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/legislation/${billId}/votes`);

        if (!response.ok) {
          throw new Error("Failed to fetch votes");
        }

        const data: BillVotesResponse = await response.json();
        setBillVotes(data.billVotes);
        setAmendmentVotes(data.amendmentVotes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchVotes();
  }, [billId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-sm">
        <p className="font-medium">Unable to load votes</p>
        <p className="mt-1 text-destructive/80">{error}</p>
      </div>
    );
  }

  if (billVotes.length === 0 && amendmentVotes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {billVotes.length > 0 && <VoteListSection votes={billVotes} label="Roll Call Votes" />}

      <AmendmentVotesSection votes={amendmentVotes} />
    </div>
  );
}
