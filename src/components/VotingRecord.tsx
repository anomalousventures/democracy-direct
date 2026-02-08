import { useMemo, useState, useCallback } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Chamber } from "@/lib/types/legislation";
import type { VoteWithPosition, VoteStats } from "@/db/queries/votes";
import { parseBillNumber, getBillPageUrl } from "@/lib/bill-utils";
import { formatDateShort as formatDate } from "@/lib/date-utils";
import { PositionBadge } from "@/components/vote/PositionBadge";
import { useScrollShadow } from "@/hooks/useScrollShadow";

export interface VotingRecordProps {
  votes: VoteWithPosition[];
  stats: VoteStats;
  bioguideId: string;
  chamber?: Chamber;
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

interface VoteStatsBarProps {
  stats: VoteStats;
  isSticky?: boolean;
  isScrolled?: boolean;
}

function VoteStatsBar({ stats, isSticky = false, isScrolled = false }: VoteStatsBarProps) {
  const { totalVotes, yeas, nays, notVoting, present } = stats;

  if (totalVotes === 0) return null;

  const yeaPercent = (yeas / totalVotes) * 100;
  const nayPercent = (nays / totalVotes) * 100;
  const notVotingPercent = (notVoting / totalVotes) * 100;
  const presentPercent = (present / totalVotes) * 100;

  return (
    <div
      className={cn(
        "space-y-3 p-4 bg-secondary border border-border rounded-sm transition-shadow duration-200",
        isSticky && "sticky top-0 z-10",
        isScrolled && "shadow-lg"
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-primary">Voting Summary</span>
        <span className="text-muted-foreground">{totalVotes} total votes</span>
      </div>

      <div className="h-3 flex rounded-sm overflow-hidden bg-gray-100 border border-border">
        {yeaPercent > 0 && (
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${yeaPercent}%` }}
            title={`Yea: ${yeas} (${yeaPercent.toFixed(1)}%)`}
          />
        )}
        {nayPercent > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${nayPercent}%` }}
            title={`Nay: ${nays} (${nayPercent.toFixed(1)}%)`}
          />
        )}
        {presentPercent > 0 && (
          <div
            className="bg-amber-400 transition-all duration-500"
            style={{ width: `${presentPercent}%` }}
            title={`Present: ${present} (${presentPercent.toFixed(1)}%)`}
          />
        )}
        {notVotingPercent > 0 && (
          <div
            className="bg-gray-300 transition-all duration-500"
            style={{ width: `${notVotingPercent}%` }}
            title={`Not Voting: ${notVoting} (${notVotingPercent.toFixed(1)}%)`}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-muted-foreground">
            Yea <span className="font-medium text-foreground">{yeas}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-muted-foreground">
            Nay <span className="font-medium text-foreground">{nays}</span>
          </span>
        </div>
        {present > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-muted-foreground">
              Present <span className="font-medium text-foreground">{present}</span>
            </span>
          </div>
        )}
        {notVoting > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gray-300" />
            <span className="text-muted-foreground">
              Not Voting <span className="font-medium text-foreground">{notVoting}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
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

          {vote.sourceUrl ? (
            <a
              href={vote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-medium text-primary hover:text-accent transition-colors line-clamp-2 mb-2"
            >
              {displayTitle}
              <Icon name="external-link" className="inline-block w-3.5 h-3.5 ml-1.5 opacity-60" />
            </a>
          ) : (
            <p className="block font-medium text-primary line-clamp-2 mb-2">{displayTitle}</p>
          )}

          {vote.question !== displayTitle && (
            <p className="text-sm text-muted-foreground mb-2">{vote.question}</p>
          )}

          {vote.billSubjects && vote.billSubjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Icon name="tag" className="w-3.5 h-3.5 text-muted-foreground" />
              {vote.billSubjects.slice(0, 3).map((subject, i) => (
                <span
                  key={i}
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
              className={cn(
                "px-2 py-0.5 rounded-sm font-medium",
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
      <VoteStatsBar stats={stats} isSticky={true} isScrolled={isScrolled} />

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
