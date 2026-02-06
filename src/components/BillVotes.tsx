import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { BillVotesResponse, BillVote } from "@/pages/api/legislation/[billId]/votes";
import { VoteStatsBar } from "@/components/vote/VoteStatsBar";
import { PartyBreakdown } from "@/components/vote/PartyBreakdown";
import { MemberVoteList } from "@/components/vote/MemberVoteList";
import { YourRepsBanner } from "@/components/vote/YourRepsBanner";

interface BillVotesProps {
  billId: string;
  className?: string;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getVoteDetailUrl(vote: BillVote): string {
  return `/vote/${vote.chamber}/${vote.congress}/${vote.session}/${vote.rollCall}`;
}

interface VoteCardProps {
  vote: BillVote;
  expanded: boolean;
  onToggle: () => void;
}

function VoteCard({ vote, expanded, onToggle }: VoteCardProps) {
  const chamberLabel = vote.chamber === "house" ? "House" : "Senate";

  return (
    <article className="border border-border bg-white rounded-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {chamberLabel} Roll Call #{vote.rollCall}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(vote.date)}</span>
            </div>
            <p className="font-medium text-primary line-clamp-2">{vote.question}</p>
            <span
              className={cn(
                "inline-block mt-2 px-2 py-0.5 text-xs rounded-sm font-medium",
                vote.result.toLowerCase().includes("passed") ||
                  vote.result.toLowerCase().includes("agreed")
                  ? "bg-green-50 text-green-700"
                  : vote.result.toLowerCase().includes("failed") ||
                      vote.result.toLowerCase().includes("rejected")
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-600"
              )}
            >
              {vote.result}
            </span>
          </div>
          <Icon
            name="chevron-down"
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-6 border-t border-border">
          <YourRepsBanner members={vote.members} />

          <VoteStatsBar
            yeas={vote.yeas}
            nays={vote.nays}
            notVoting={vote.notVoting}
            present={vote.present}
          />

          <PartyBreakdown members={vote.members} />

          <MemberVoteList members={vote.members} />

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <a
              href={getVoteDetailUrl(vote)}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors font-medium"
            >
              View full details
              <Icon name="chevron-right" className="w-4 h-4" />
            </a>
            {vote.sourceUrl && (
              <a
                href={vote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
              >
                View official record
                <Icon name="external-link" className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
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

export function BillVotes({ billId, className }: BillVotesProps) {
  const [votes, setVotes] = useState<BillVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVoteId, setExpandedVoteId] = useState<string | null>(null);

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
        setVotes(data.votes);

        if (data.votes.length > 0) {
          setExpandedVoteId(data.votes[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchVotes();
  }, [billId]);

  const handleToggle = useCallback((voteId: string) => {
    setExpandedVoteId((prev) => (prev === voteId ? null : voteId));
  }, []);

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

  if (votes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {votes.map((vote) => (
        <VoteCard
          key={vote.id}
          vote={vote}
          expanded={expandedVoteId === vote.id}
          onToggle={() => handleToggle(vote.id)}
        />
      ))}
    </div>
  );
}
