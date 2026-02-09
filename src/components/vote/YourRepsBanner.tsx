import { useMyReps } from "@/hooks/useMyReps";
import { PositionBadge } from "@/components/vote/PositionBadge";
import type { VoteMember } from "@/lib/types/vote";
import type { RepresentativeInfo } from "@/pages/api/user/representatives";

interface YourRepsBannerProps {
  members: VoteMember[];
}

export function YourRepsBanner({ members }: YourRepsBannerProps) {
  const { reps, isLoading, hasDistrict } = useMyReps();

  if (isLoading || !hasDistrict || reps.length === 0) return null;

  const membersByBioguide = new Map(members.map((m) => [m.bioguideId, m]));
  const matchedReps: Array<RepresentativeInfo & { position: VoteMember["position"] }> = [];
  for (const rep of reps) {
    const member = membersByBioguide.get(rep.bioguideId);
    if (member) {
      matchedReps.push({ ...rep, position: member.position });
    }
  }

  if (matchedReps.length === 0) return null;

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-sm p-4">
      <p className="text-sm font-semibold text-primary mb-3">Your Representatives Voted</p>
      <div className="flex flex-wrap gap-3">
        {matchedReps.map((rep) => (
          <a
            key={rep.bioguideId}
            href={`/rep/${rep.bioguideId}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-sm hover:shadow-sm transition-shadow"
          >
            <span className="text-sm font-medium text-primary">{rep.fullName}</span>
            <span className="text-xs text-muted-foreground">
              ({rep.party}-{rep.state})
            </span>
            <PositionBadge position={rep.position} />
          </a>
        ))}
      </div>
    </div>
  );
}
