import { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { VotePosition } from "@/lib/types/legislation";
import type { BillVotesResponse, BillVote, VoteMember } from "@/pages/api/bill/[billId]/votes";

interface BillVotesProps {
  billId: string;
  className?: string;
}

type PositionStyle = {
  label: string;
  bg: string;
  text: string;
  border: string;
};

const POSITION_STYLES: Record<VotePosition, PositionStyle> = {
  yea: {
    label: "Yea",
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  nay: {
    label: "Nay",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
  not_voting: {
    label: "Not Voting",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  present: {
    label: "Present",
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
  },
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PositionBadge({ position }: { position: VotePosition }) {
  const style = POSITION_STYLES[position];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded-sm",
        style.bg,
        style.text,
        style.border
      )}
    >
      {style.label}
    </span>
  );
}

interface VoteStatsBarProps {
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
}

function VoteStatsBar({ yeas, nays, notVoting, present }: VoteStatsBarProps) {
  const total = yeas + nays + notVoting + present;
  if (total === 0) return null;

  const yeaPercent = (yeas / total) * 100;
  const nayPercent = (nays / total) * 100;
  const notVotingPercent = (notVoting / total) * 100;
  const presentPercent = (present / total) * 100;

  return (
    <div className="space-y-2">
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

interface PartyBreakdownProps {
  members: VoteMember[];
}

function PartyBreakdown({ members }: PartyBreakdownProps) {
  const breakdown = useMemo(() => {
    const stats: Record<string, Record<VotePosition, number>> = {};

    for (const member of members) {
      const party = member.party || "Other";
      if (!stats[party]) {
        stats[party] = { yea: 0, nay: 0, not_voting: 0, present: 0 };
      }
      stats[party][member.position]++;
    }

    return Object.entries(stats)
      .sort((a, b) => {
        const order = ["D", "R", "I"];
        return order.indexOf(a[0]) - order.indexOf(b[0]);
      })
      .map(([party, counts]) => ({
        party,
        label:
          party === "D"
            ? "Democrats"
            : party === "R"
              ? "Republicans"
              : party === "I"
                ? "Independents"
                : party,
        ...counts,
      }));
  }, [members]);

  if (breakdown.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Party Breakdown</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {breakdown.map(({ party, label, yea, nay, not_voting, present }) => (
          <div key={party} className="p-3 bg-secondary/50 border border-border rounded-sm">
            <p className="font-medium text-primary mb-2">{label}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-green-700">Yea: {yea}</span>
              <span className="text-red-700">Nay: {nay}</span>
              {not_voting > 0 && <span className="text-gray-600">NV: {not_voting}</span>}
              {present > 0 && <span className="text-amber-700">P: {present}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MemberListProps {
  members: VoteMember[];
  filter: VotePosition | "all";
  search: string;
}

function MemberList({ members, filter, search }: MemberListProps) {
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesFilter = filter === "all" || m.position === filter;
      const matchesSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.state.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [members, filter, search]);

  if (filteredMembers.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No members match your filters.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {filteredMembers.map((member) => (
        <a
          key={member.bioguideId}
          href={`/rep/${member.bioguideId}`}
          className="flex items-center justify-between p-2 border border-border rounded-sm hover:bg-secondary/50 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-medium text-primary truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground">
              {member.party}-{member.state}
            </p>
          </div>
          <PositionBadge position={member.position} />
        </a>
      ))}
    </div>
  );
}

interface VoteCardProps {
  vote: BillVote;
  expanded: boolean;
  onToggle: () => void;
}

function VoteCard({ vote, expanded, onToggle }: VoteCardProps) {
  const [filter, setFilter] = useState<VotePosition | "all">("all");
  const [search, setSearch] = useState("");

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
          <VoteStatsBar
            yeas={vote.yeas}
            nays={vote.nays}
            notVoting={vote.notVoting}
            present={vote.present}
          />

          <PartyBreakdown members={vote.members} />

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="search"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "yea", "nay", "not_voting", "present"] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setFilter(pos)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors",
                      filter === pos
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {pos === "all"
                      ? "All"
                      : pos === "not_voting"
                        ? "Not Voting"
                        : pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <MemberList members={vote.members} filter={filter} search={search} />
          </div>

          {vote.sourceUrl && (
            <div className="pt-4 border-t border-border">
              <a
                href={vote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
              >
                View official record
                <Icon name="external-link" className="w-4 h-4" />
              </a>
            </div>
          )}
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

        const response = await fetch(`/api/bill/${billId}/votes`);

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
