import { useEffect, useState, type ReactNode } from "react";
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

type FetchState = "loading" | "loaded" | "not-found" | "error";

interface DistrictTooltipProps {
  districtInfo: DistrictInfo;
  onClose?: () => void;
}

const AT_LARGE_VALUES = new Set(["00", "0"]);

function isAtLarge(district: string): boolean {
  return AT_LARGE_VALUES.has(district);
}

function formatDistrictLabel(district: string): string {
  if (isAtLarge(district)) return "At-Large";
  const num = parseInt(district, 10);
  return `${num}${getOrdinalSuffix(num)} District`;
}

export function DistrictTooltip({ districtInfo, onClose }: DistrictTooltipProps) {
  const [rep, setRep] = useState<RepData | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("loading");

  const stateAbbr = fipsToState(districtInfo.state);
  const stateName = stateAbbr ? getStateName(stateAbbr) : districtInfo.state;
  const districtLabel = formatDistrictLabel(districtInfo.district);

  useEffect(() => {
    if (!stateAbbr) {
      setFetchState("error");
      return;
    }

    const controller = new AbortController();
    setFetchState("loading");
    setRep(null);

    const params = new URLSearchParams({ state: stateAbbr, district: districtInfo.district });

    fetch(`/api/rep/by-district?${params}`, { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
          setFetchState("not-found");
          return null;
        }
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: RepData | null) => {
        if (data) {
          setRep(data);
          setFetchState("loaded");
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.warn("Failed to fetch representative:", err);
        setFetchState("error");
      });

    return () => controller.abort();
  }, [stateAbbr, districtInfo.district]);

  const fetchStateContent: Record<FetchState, ReactNode> = {
    loading: <LoadingSkeleton />,
    loaded: rep ? <RepInfo rep={rep} /> : null,
    "not-found": <MissingRep />,
    error: <ErrorState />,
  };

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

        {fetchStateContent[fetchState]}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading representative data">
      <div className="h-4 w-3/4 bg-muted rounded-sm animate-pulse" />
      <div className="h-3 w-1/2 bg-muted rounded-sm animate-pulse" />
    </div>
  );
}

function RepInfo({ rep }: { rep: RepData }) {
  const partyColor = getPartyColor(rep.party);
  const partyLabel = getPartyLabel(rep.party, true);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className={`${partyColor} w-5 h-5 flex-center rounded-sm text-white text-[10px] font-bold shrink-0`}
        >
          {partyLabel}
        </span>
        <span className="text-sm font-semibold text-foreground leading-tight">{rep.fullName}</span>
      </div>

      <a
        href={`/rep/${rep.bioguideId}`}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary text-primary-foreground text-xs font-semibold tracking-wide rounded-sm hover:bg-primary/90 transition-colors"
      >
        View Representative
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}

function MissingRep() {
  return <p className="text-xs text-muted-foreground italic">Representative data unavailable</p>;
}

function ErrorState() {
  return <p className="text-xs text-destructive">Could not load representative data</p>;
}
