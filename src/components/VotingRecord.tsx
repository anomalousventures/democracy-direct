import { useMemo, useState, useCallback } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { VoteWithPosition, VoteStats } from "@/db/queries/votes";
import { parseBillNumber, getBillPageUrl } from "@/lib/bill-utils";
import { formatDateShort as formatDate } from "@/lib/date-utils";
import { getVoteResultStyle } from "@/lib/vote-result-style";
import { PositionBadge } from "@/components/vote/PositionBadge";
import { VoteStatsBar } from "@/components/vote/VoteStatsBar";
import { useScrollShadow } from "@/hooks/useScrollShadow";

export interface VotingRecordProps {
  votes: VoteWithPosition[];
  stats: VoteStats;
  className?: string;
}

function getVoteDisplayTitle(vote: VoteWithPosition): string {
  if (vote.billTitle) {
    return vote.billTitle;
  }
  if (vote.billNumber) {
    return `${vote.billNumber}: ${vote.question}`;
  }
  return vote.question;
}

function getBillLink(billNumber: string | null, congress: number): string | null {
  if (!billNumber) return null;
  const parsed = parseBillNumber(billNumber);
  if (!parsed) return null;
  return getBillPageUrl(parsed.type, String(parsed.number), congress);
}

function getVoteDetailUrl(vote: VoteWithPosition): string {
  return `/vote/${vote.chamber}/${vote.congress}/${vote.session}/${vote.rollCall}`;
}

function VoteCard({ vote }: { vote: VoteWithPosition }) {
  const chamberLabel = vote.chamber === "house" ? "House" : "Senate";
  const displayTitle = getVoteDisplayTitle(vote);
  const billLink = getBillLink(vote.billNumber, vote.congress);
  const voteDetailUrl = getVoteDetailUrl(vote);

  return (
    <article className="group relative border border-border bg-white rounded-sm p-4 hover:shadow-[var(--shadow-civic)] transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PositionBadge position={vote.position} className="px-2.5 py-1" />
            <a
              href={voteDetailUrl}
              className="text-xs text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors"
            >
              {chamberLabel} Roll Call #{vote.rollCall}
            </a>
            {vote.billNumber &&
              (billLink ? (
                <a href={billLink} className="text-xs font-semibold text-accent hover:underline">
                  {vote.billNumber}
                </a>
              ) : (
                <span className="text-xs font-semibold text-accent">{vote.billNumber}</span>
              ))}
          </div>

          <a
            href={voteDetailUrl}
            className="block font-medium text-primary hover:text-accent transition-colors line-clamp-2 mb-2"
          >
            {displayTitle}
          </a>

          {vote.billTitle && vote.question !== displayTitle && (
            <p className="text-sm text-muted-foreground mb-2">{vote.question}</p>
          )}

          {vote.billSubjects && vote.billSubjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Icon name="tag" className="w-3.5 h-3.5 text-muted-foreground" />
              {vote.billSubjects.slice(0, 3).map((subject) => (
                <span
                  key={subject}
                  className="px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-sm"
                >
                  {subject}
                </span>
              ))}
              {vote.billSubjects.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{vote.billSubjects.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icon name="calendar" className="w-3.5 h-3.5" />
              {formatDate(vote.date)}
            </span>
            <span
              className={cn("px-2 py-0.5 rounded-sm font-medium", getVoteResultStyle(vote.result))}
            >
              {vote.result}
            </span>
            <a
              href={voteDetailUrl}
              className="text-primary hover:text-accent font-medium transition-colors"
            >
              View vote details
            </a>
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
        <Icon name="gavel" className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">No Recorded Votes</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        This representative doesn't have any recorded votes yet. Check back later as voting records
        are updated regularly.
      </p>
    </div>
  );
}

export function VotingRecord({ votes, stats, className }: VotingRecordProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const { ref: scrollContainerRef, isScrolled } = useScrollShadow();

  const visibleVotes = useMemo(() => votes.slice(0, displayCount), [votes, displayCount]);

  const hasMore = votes.length > displayCount;

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 10);
  }, []);

  if (votes.length === 0) {
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
      data-testid="voting-record-scroll-container"
    >
      <VoteStatsBar
        yeas={stats.yeas}
        nays={stats.nays}
        notVoting={stats.notVoting}
        present={stats.present}
        header="Voting Summary"
        totalLabel={`${stats.totalVotes} total votes`}
        isSticky
        isScrolled={isScrolled}
      />

      <div className="space-y-3 pt-4">
        {visibleVotes.map((vote, index) => (
          <div
            key={vote.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
          >
            <VoteCard vote={vote} />
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
            Load More Votes
            <span className="text-muted-foreground">({votes.length - displayCount} remaining)</span>
          </button>
        </div>
      )}
    </div>
  );
}
