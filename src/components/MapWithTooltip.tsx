import { Component, useState, type ReactNode } from "react";
import type { DistrictInfo } from "@/lib/tigerweb";
import { DistrictMap, type InitialView, type HighlightDistrict } from "./DistrictMap";
import { DistrictTooltip } from "./DistrictTooltip";

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("Map component crashed:", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex-center bg-background/60">
          <div className="text-center space-y-2 px-4">
            <p className="text-sm text-destructive font-medium">The map could not be displayed.</p>
            <p className="text-xs text-muted-foreground">
              Try{" "}
              <a href="/" className="underline hover:text-primary transition-colors">
                looking up your ZIP code
              </a>{" "}
              instead.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface MapWithTooltipProps {
  initialView?: InitialView;
  highlightDistrict?: HighlightDistrict;
}

export function MapWithTooltip({ initialView, highlightDistrict }: MapWithTooltipProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo | null>(null);

  return (
    <MapErrorBoundary>
      <div className="absolute inset-0 z-10">
        <DistrictMap
          className="absolute inset-0"
          onDistrictSelect={setSelectedDistrict}
          initialView={initialView}
          highlightDistrict={highlightDistrict}
        />
        {selectedDistrict && (
          <div className="absolute top-4 left-4 z-20">
            <DistrictTooltip
              districtInfo={selectedDistrict}
              onClose={() => setSelectedDistrict(null)}
            />
          </div>
        )}
      </div>
    </MapErrorBoundary>
  );
}
