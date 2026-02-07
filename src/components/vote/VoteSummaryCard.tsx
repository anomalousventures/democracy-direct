import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { enrichVoteQuestion } from "@/lib/vote-question-utils";
import type { Chamber } from "@/lib/types/legislation";

export interface VoteSummaryCardProps {
  vote: {
    id: string;
    rollCall: number;
    chamber: Chamber;
    congress: number;
    session: number;
    date: Date | string;
    question: string;
    result: string;
    yeas: number;
    nays: number;
    notVoting: number;
    present: number;
    sourceUrl: string | null;
    amendmentId?: string | null;
    amendmentNumber?: string | null;
    amendmentPurpose?: string | null;
  };
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

function getResultStyle(result: string) {
  const lower = result.toLowerCase();
  if (lower.includes("passed") || lower.includes("agreed")) {
    return "bg-green-50 text-green-700";
  }
  if (lower.includes("failed") || lower.includes("rejected")) {
    return "bg-red-50 text-red-700";
  }
  return "bg-gray-50 text-gray-600";
}

export function VoteSummaryCard({ vote }: VoteSummaryCardProps) {
  const chamberLabel = vote.chamber === "house" ? "House" : "Senate";
  const voteDetailUrl = `/vote/${vote.chamber}/${vote.congress}/${vote.session}/${vote.rollCall}`;
  const total = vote.yeas + vote.nays + vote.notVoting + vote.present;

  const displayQuestion = enrichVoteQuestion({
    question: vote.question,
    amendmentPurpose: vote.amendmentPurpose,
    amendmentNumber: vote.amendmentNumber,
  });

  return (
    <article className="border border-border bg-white rounded-sm p-4 hover:shadow-[var(--shadow-civic)] transition-shadow duration-200">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={voteDetailUrl}
            className="text-xs text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors"
          >
            {chamberLabel} Roll Call #{vote.rollCall}
          </a>
          <span
            className={cn(
              "px-2 py-0.5 text-xs rounded-sm font-medium",
              getResultStyle(vote.result)
            )}
          >
            {vote.result}
          </span>
          {vote.amendmentId && (
            <span className="px-2 py-0.5 text-xs rounded-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
              Amendment
            </span>
          )}
        </div>

        <a
          href={voteDetailUrl}
          className="font-medium text-primary hover:text-accent transition-colors line-clamp-2"
        >
          {displayQuestion}
        </a>

        {total > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">{vote.yeas} Yea</span>
            <span className="text-red-600 font-medium">{vote.nays} Nay</span>
            {vote.notVoting > 0 && <span>{vote.notVoting} Not Voting</span>}
            {vote.present > 0 && <span>{vote.present} Present</span>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Icon name="calendar" className="w-3.5 h-3.5" />
            {formatDate(vote.date)}
          </span>
          {vote.sourceUrl && (
            <a
              href={vote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              Official record
              <Icon name="external-link" className="w-3 h-3 opacity-60" />
            </a>
          )}
          <a
            href={voteDetailUrl}
            className="text-primary hover:text-accent font-medium transition-colors"
          >
            View full details
          </a>
        </div>
      </div>
    </article>
  );
}
