import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Chamber } from "@/lib/types/legislation";
import type { VoteMember } from "@/lib/types/vote";
import { VoteStatsBar } from "@/components/vote/VoteStatsBar";
import { PartyBreakdown } from "@/components/vote/PartyBreakdown";
import { MemberVoteList } from "@/components/vote/MemberVoteList";
import { YourRepsBanner } from "@/components/vote/YourRepsBanner";
import { getOrdinalSuffix } from "@/lib/legislator-utils";
import { formatDateLong as formatDate } from "@/lib/date-utils";

interface VoteData {
  id: string;
  rollCall: number;
  chamber: Chamber;
  congress: number;
  session: number;
  date: string;
  question: string;
  result: string;
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
  sourceUrl: string | null;
  billNumber: string | null;
  billTitle: string | null;
}

interface AmendmentContext {
  url: string;
  displayNumber: string;
  purpose: string | null;
}

interface VoteDetailProps {
  vote: VoteData;
  members: VoteMember[];
  billLink: { url: string; label: string } | null;
  amendment?: AmendmentContext | null;
}

export function VoteDetail({ vote, members, billLink, amendment }: VoteDetailProps) {
  const chamberLabel = vote.chamber === "house" ? "House" : "Senate";

  return (
    <div data-testid="vote-detail" className="space-y-8">
      <div className="text-center animate-fade-up">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <span
            data-testid="vote-roll-call"
            className="inline-flex items-center px-4 py-2 text-lg font-bold bg-primary text-primary-foreground rounded-sm"
          >
            {chamberLabel} Roll Call #{vote.rollCall}
          </span>
          <span
            data-testid="vote-result"
            className={cn(
              "inline-flex items-center px-3 py-1.5 text-sm font-semibold border rounded-sm",
              vote.result.toLowerCase().includes("passed") ||
                vote.result.toLowerCase().includes("agreed")
                ? "bg-green-100 text-green-800 border-green-200"
                : vote.result.toLowerCase().includes("failed") ||
                    vote.result.toLowerCase().includes("rejected")
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
            )}
          >
            {vote.result}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {vote.congress}
          {getOrdinalSuffix(vote.congress)} Congress, Session {vote.session} &middot;{" "}
          {formatDate(vote.date)}
        </p>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary max-w-4xl mx-auto leading-tight">
          {vote.question}
        </h1>

        {billLink && (
          <p className="mt-4 text-sm">
            <a href={billLink.url} className="text-accent hover:underline font-medium">
              {billLink.label}
              {vote.billTitle ? `: ${vote.billTitle}` : null}
            </a>
            {!vote.billTitle && (
              <span className="block mt-1 text-xs text-muted-foreground italic">
                Bill details are not available yet. Check back as legislative data is updated
                regularly.
              </span>
            )}
          </p>
        )}

        {amendment && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-sm text-sm">
            <a
              href={amendment.url}
              className="font-medium text-purple-800 hover:text-purple-900 transition-colors"
            >
              {amendment.displayNumber}
            </a>
            {amendment.purpose && (
              <span className="text-purple-700 ml-1">— {amendment.purpose}</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6 animate-fade-up-delay-1">
        <YourRepsBanner members={members} />

        <VoteStatsBar
          yeas={vote.yeas}
          nays={vote.nays}
          notVoting={vote.notVoting}
          present={vote.present}
        />

        <PartyBreakdown members={members} />

        <MemberVoteList members={members} />

        {vote.sourceUrl && (
          <div className="pt-4 border-t border-border">
            <a
              href={vote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
            >
              View official record on Congress.gov
              <Icon name="external-link" className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
