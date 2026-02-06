export interface VoteStatsBarProps {
  yeas: number;
  nays: number;
  notVoting: number;
  present: number;
}

export function VoteStatsBar({ yeas, nays, notVoting, present }: VoteStatsBarProps) {
  const total = yeas + nays + notVoting + present;
  if (total === 0) return null;

  const yeaPercent = (yeas / total) * 100;
  const nayPercent = (nays / total) * 100;
  const notVotingPercent = (notVoting / total) * 100;
  const presentPercent = (present / total) * 100;

  return (
    <div data-testid="vote-stats-bar" className="space-y-2">
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
