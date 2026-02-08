import { useMemo } from "react";
import type { VotePosition } from "@/lib/types/legislation";
import type { VoteMember } from "@/lib/types/vote";

interface PartyBreakdownProps {
  members: VoteMember[];
}

const PARTY_LABELS: Record<string, string> = {
  D: "Democrats",
  R: "Republicans",
  I: "Independents",
};

export function PartyBreakdown({ members }: PartyBreakdownProps) {
  const breakdown = useMemo(() => {
    const stats: Record<string, Record<VotePosition, number>> = {};

    for (const member of members) {
      const party = member.party || "Other";
      if (!stats[party]) {
        stats[party] = { yea: 0, nay: 0, not_voting: 0, present: 0 };
      }
      stats[party][member.position]++;
    }

    const partyOrder = ["D", "R", "I"];
    return Object.entries(stats)
      .sort((a, b) => partyOrder.indexOf(a[0]) - partyOrder.indexOf(b[0]))
      .map(([party, counts]) => ({
        party,
        label: PARTY_LABELS[party] ?? party,
        ...counts,
      }));
  }, [members]);

  if (breakdown.length === 0) return null;

  return (
    <div data-testid="party-breakdown" className="space-y-3">
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
