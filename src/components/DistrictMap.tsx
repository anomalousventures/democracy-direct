import { useState, useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getAllDistrictsGeoJSON, queryDistrictAtPoint, type DistrictInfo } from "@/lib/tigerweb";

type MapState = "loading" | "ready" | "error";

interface DistrictMapProps {
  onDistrictSelect?: (district: DistrictInfo | null) => void;
  className?: string;
}

const STADIA_STYLE = "https://tiles.stadiamaps.com/styles/alidade_smooth.json";
const US_CENTER: [number, number] = [-98.5, 39.8];
const US_ZOOM = 4;
const FETCH_TIMEOUT_MS = 15_000;

const DISTRICT_SOURCE = "districts";
const DISTRICT_FILL_LAYER = "district-fill";
const DISTRICT_LINE_LAYER = "district-line";

export function DistrictMap({ onDistrictSelect, className }: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapState, setMapState] = useState<MapState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMapClick = useCallback(
    async (e: maplibregl.MapMouseEvent) => {
      if (!onDistrictSelect) return;
      const { lng, lat } = e.lngLat;
      const district = await queryDistrictAtPoint(lng, lat);
      onDistrictSelect(district);
    },
    [onDistrictSelect]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STADIA_STYLE,
      center: US_CENTER,
      zoom: US_ZOOM,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

    map.on("load", async () => {
      try {
        const geojson = await getAllDistrictsGeoJSON(abortController.signal);
        clearTimeout(timeoutId);

        if (abortController.signal.aborted) return;

        map.addSource(DISTRICT_SOURCE, { type: "geojson", data: geojson });

        map.addLayer({
          id: DISTRICT_FILL_LAYER,
          type: "fill",
          source: DISTRICT_SOURCE,
          paint: {
            "fill-color": "#1e3a5f",
            "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.22, 0.1],
          },
        });

        map.addLayer({
          id: DISTRICT_LINE_LAYER,
          type: "line",
          source: DISTRICT_SOURCE,
          paint: {
            "line-color": "#1e3a5f",
            "line-opacity": 0.45,
            "line-width": 1,
          },
        });

        setMapState("ready");
      } catch (err) {
        clearTimeout(timeoutId);
        const message =
          err instanceof DOMException && err.name === "AbortError"
            ? "District data took too long to load."
            : "Could not load district boundaries.";
        setErrorMessage(message);
        setMapState("error");
      }
    });

    map.on("click", handleMapClick);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
      map.remove();
      mapRef.current = null;
    };
  }, [handleMapClick]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={containerRef} className="absolute inset-0" />

      {mapState === "loading" && <LoadingOverlay />}
      {mapState === "error" && <ErrorOverlay message={errorMessage} />}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex-center bg-background/60 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center gap-4 animate-fade-up">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground tracking-wide">
          Loading district boundaries&hellip;
        </p>
      </div>
    </div>
  );
}

function ErrorOverlay({ message }: { message: string | null }) {
  return (
    <div className="absolute inset-x-0 top-4 z-10 flex justify-center pointer-events-none">
      <div className="pointer-events-auto mx-4 max-w-md alert-error rounded-sm shadow-civic animate-fade-up">
        <svg
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p>{message ?? "Could not load district boundaries."}</p>
          <p className="mt-1">
            Try{" "}
            <a href="/" className="underline font-medium hover:text-primary">
              looking up your ZIP code
            </a>{" "}
            instead.
          </p>
        </div>
      </div>
    </div>
  );
}
