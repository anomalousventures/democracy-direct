import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";
import type { VotePosition } from "@/lib/types/legislation";
import type { VoteMember } from "@/lib/types/vote";
import { PositionBadge } from "./PositionBadge";
import { useScrollShadow } from "@/hooks/useScrollShadow";

const POSITION_LABELS: Record<string, string> = {
  all: "All",
  yea: "Yea",
  nay: "Nay",
  not_voting: "Not Voting",
  present: "Present",
};

interface MemberVoteListProps {
  members: VoteMember[];
  defaultFilter?: VotePosition | "all";
}

function MemberList({
  members,
  filter,
  search,
}: {
  members: VoteMember[];
  filter: VotePosition | "all";
  search: string;
}) {
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesFilter = filter === "all" || m.position === filter;
      const matchesSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.state.toLowerCase().includes(search.toLowerCase()) ||
        m.party.toLowerCase().includes(search.toLowerCase());
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

export function MemberVoteList({ members, defaultFilter = "all" }: MemberVoteListProps) {
  const [filter, setFilter] = useState<VotePosition | "all">(defaultFilter);
  const [search, setSearch] = useState("");
  const { ref, isScrolled } = useScrollShadow();

  return (
    <div
      ref={ref}
      data-testid="member-vote-list"
      className="scroll-container-civic max-h-[400px] md:max-h-[600px] relative"
    >
      <div
        className={cn(
          "space-y-3 p-3 bg-secondary border border-border rounded-sm transition-shadow duration-200 sticky top-0 z-10",
          isScrolled && "shadow-lg"
        )}
      >
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
                type="button"
                onClick={() => setFilter(pos)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors",
                  filter === pos
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {POSITION_LABELS[pos] ?? pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3">
        <MemberList members={members} filter={filter} search={search} />
      </div>
    </div>
  );
}
