import { useEffect, useState } from "react";
import { getOrdinalSuffix, getPartyColor, getPartyLabel } from "@/lib/legislator-utils";
import { getStateName } from "@/lib/states";
import { fipsToState, type DistrictInfo } from "@/lib/tigerweb";

interface RepData {
  bioguideId: string;
  fullName: string;
  party: string;
  state: string;
  district: string | null;
}

interface DistrictTooltipProps {
  districtInfo: DistrictInfo;
  onClose?: () => void;
}

const AT_LARGE_VALUES = new Set(["0", "00", "AL"]);

function isAtLarge(district: string): boolean {
  return AT_LARGE_VALUES.has(district.toUpperCase());
}

function formatDistrictLabel(district: string): string {
  if (isAtLarge(district)) return "At-Large";
  const num = parseInt(district, 10);
  return `${num}${getOrdinalSuffix(num)} District`;
}

export function DistrictTooltip({ districtInfo, onClose }: DistrictTooltipProps) {
  const [houseRep, setHouseRep] = useState<RepData | null>(null);
  const [senators, setSenators] = useState<RepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const stateAbbr = fipsToState(districtInfo.state);
  const stateName = stateAbbr ? getStateName(stateAbbr) : districtInfo.state;
  const districtLabel = formatDistrictLabel(districtInfo.district);
  const districtPageUrl = stateAbbr
    ? `/reps/${stateAbbr.toLowerCase()}/${districtInfo.district}`
    : null;

  useEffect(() => {
    if (!stateAbbr) {
      setError(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setHouseRep(null);
    setSenators([]);

    const houseParams = new URLSearchParams({ state: stateAbbr, district: districtInfo.district });
    const senateParams = new URLSearchParams({ state: stateAbbr, chamber: "senate" });

    Promise.all([
      fetch(`/api/rep/by-district?${houseParams}`, { signal: controller.signal }).then((res) =>
        res.ok ? res.json() : null
      ),
      fetch(`/api/rep/by-district?${senateParams}`, { signal: controller.signal }).then((res) =>
        res.ok ? res.json() : null
      ),
    ])
      .then(([houseData, senateData]: [RepData | null, RepData[] | null]) => {
        if (houseData) setHouseRep(houseData);
        if (senateData) setSenators(Array.isArray(senateData) ? senateData : [senateData]);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [stateAbbr, districtInfo.district]);

  const allReps = [...(houseRep ? [houseRep] : []), ...senators];

  return (
    <div
      className="animate-fade-slide-in w-72 bg-popover text-popover-foreground border border-border rounded-sm overflow-hidden"
      style={{ boxShadow: "var(--shadow-civic-lg)" }}
    >
      <div className="h-1 bg-gradient-to-r from-primary to-accent" />

      <div className="p-4">
        <div className="flex-between mb-3">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-primary leading-tight">
              {stateName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{districtLabel}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -mt-1 -mr-1"
              aria-label="Close tooltip"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="h-px bg-border mb-3" />

        {loading && <LoadingSkeleton />}
        {error && <ErrorState />}
        {!loading && !error && allReps.length === 0 && <MissingRep />}
        {!loading && !error && allReps.length > 0 && (
          <div className="space-y-2.5">
            {allReps.map((rep) => (
              <RepRow key={rep.bioguideId} rep={rep} />
            ))}
          </div>
        )}

        {districtPageUrl && !loading && (
          <>
            <div className="h-px bg-border my-3" />
            <a
              href={districtPageUrl}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary text-primary-foreground text-xs font-semibold tracking-wide rounded-sm hover:bg-primary/90 transition-colors"
            >
              View full district page
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading representative data">
      <div className="h-4 w-3/4 bg-muted rounded-sm animate-pulse" />
      <div className="h-3 w-1/2 bg-muted rounded-sm animate-pulse" />
      <div className="h-3 w-2/3 bg-muted rounded-sm animate-pulse" />
    </div>
  );
}

function RepRow({ rep }: { rep: RepData }) {
  const partyColor = getPartyColor(rep.party);
  const partyLabel = getPartyLabel(rep.party, true);
  const chamber = rep.district === null ? "Senator" : "Representative";

  return (
    <a href={`/rep/${rep.bioguideId}`} className="flex items-center gap-2.5 group">
      <span
        className={`${partyColor} w-5 h-5 flex-center rounded-sm text-white text-[10px] font-bold shrink-0`}
      >
        {partyLabel}
      </span>
      <div className="min-w-0">
        <span className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
          {rep.fullName}
        </span>
        <span className="block text-[11px] text-muted-foreground">{chamber}</span>
      </div>
    </a>
  );
}

function MissingRep() {
  return <p className="text-xs text-muted-foreground italic">Representative data unavailable</p>;
}

function ErrorState() {
  return <p className="text-xs text-destructive">Could not load representative data</p>;
}
