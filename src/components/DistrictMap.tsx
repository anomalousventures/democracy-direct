import { useState, useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { DistrictInfo } from "@/lib/tigerweb";
import { ensurePmtilesProtocol } from "@/lib/pmtiles-protocol";
import { getDistrictBounds } from "@/lib/district-bounds";
import { Icon } from "@/components/icons";

type MapState = "loading" | "ready" | "error";

export interface InitialView {
  lat: number;
  lng: number;
  zoom: number;
}

export interface HighlightDistrict {
  state: string;
  district: string;
}

interface DistrictMapProps {
  onDistrictSelect?: (district: DistrictInfo | null) => void;
  className?: string;
  initialView?: InitialView;
  highlightDistrict?: HighlightDistrict;
}

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const US_CENTER: [number, number] = [-98.5, 39.8];
const US_ZOOM = 4;

const DISTRICT_SOURCE = "districts";
const DISTRICT_FILL_LAYER = "district-fill";
const DISTRICT_LINE_LAYER = "district-line";
const DISTRICT_SOURCE_LAYER = "districts";

export function DistrictMap({
  onDistrictSelect,
  className,
  initialView,
  highlightDistrict,
}: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredIdRef = useRef<string | number | null>(null);
  const [mapState, setMapState] = useState<MapState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (!onDistrictSelect) return;
      const map = mapRef.current;
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, { layers: [DISTRICT_FILL_LAYER] });
      if (!features.length || !features[0].properties) {
        onDistrictSelect(null);
        return;
      }

      const props = features[0].properties;
      const cd = parseInt(props.CD119, 10);
      onDistrictSelect({
        state: props.STATE,
        district: cd === 98 ? "0" : String(cd),
        name: props.NAME,
        geoid: props.GEOID,
      });
    },
    [onDistrictSelect]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    ensurePmtilesProtocol();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: US_CENTER,
      zoom: US_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", async () => {
      try {
        map.addSource(DISTRICT_SOURCE, {
          type: "vector",
          url: "pmtiles:///data/districts.pmtiles",
          promoteId: "GEOID",
        });

        map.addLayer({
          id: DISTRICT_FILL_LAYER,
          type: "fill",
          source: DISTRICT_SOURCE,
          "source-layer": DISTRICT_SOURCE_LAYER,
          paint: {
            "fill-color": "#1e3a5f",
            "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.25, 0],
          },
        });

        map.addLayer({
          id: DISTRICT_LINE_LAYER,
          type: "line",
          source: DISTRICT_SOURCE,
          "source-layer": DISTRICT_SOURCE_LAYER,
          paint: {
            "line-color": "#1e3a5f",
            "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.8, 0.35],
            "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 1],
          },
        });

        map.on("mousemove", DISTRICT_FILL_LAYER, (e) => {
          if (e.features && e.features.length > 0) {
            const id = e.features[0].id;
            if (id == null) return;
            if (hoveredIdRef.current !== null && hoveredIdRef.current !== id) {
              map.setFeatureState(
                {
                  source: DISTRICT_SOURCE,
                  sourceLayer: DISTRICT_SOURCE_LAYER,
                  id: hoveredIdRef.current,
                },
                { hover: false }
              );
            }
            hoveredIdRef.current = id;
            map.setFeatureState(
              { source: DISTRICT_SOURCE, sourceLayer: DISTRICT_SOURCE_LAYER, id },
              { hover: true }
            );
            map.getCanvas().style.cursor = "pointer";
          }
        });

        map.on("mouseleave", DISTRICT_FILL_LAYER, () => {
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              {
                source: DISTRICT_SOURCE,
                sourceLayer: DISTRICT_SOURCE_LAYER,
                id: hoveredIdRef.current,
              },
              { hover: false }
            );
            hoveredIdRef.current = null;
          }
          map.getCanvas().style.cursor = "";
        });

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = prefersReducedMotion ? 0 : 1500;

        if (initialView) {
          map.flyTo({
            center: [initialView.lng, initialView.lat],
            zoom: initialView.zoom,
            duration,
          });
        } else if (highlightDistrict) {
          const bounds = await getDistrictBounds(
            highlightDistrict.state,
            highlightDistrict.district
          );
          if (bounds) {
            map.fitBounds(bounds, { padding: 40, duration });
          }
        }

        setMapState("ready");
      } catch {
        setErrorMessage("Could not load district boundaries.");
        setMapState("error");
      }
    });

    map.on("click", DISTRICT_FILL_LAYER, handleMapClick);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [handleMapClick]);

  const handleLocate = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo({
      center: [lng, lat],
      zoom: 11,
      duration: prefersReducedMotion ? 0 : 1500,
    });
  }, []);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="w-full h-full"
        role="application"
        aria-label="Interactive congressional district map. Use arrow keys to pan, plus and minus to zoom."
        tabIndex={0}
      />

      {mapState === "ready" && <GeolocationControl onLocate={handleLocate} />}
      {mapState === "loading" && (
        <LoadingOverlay hasTarget={!!(initialView || highlightDistrict)} />
      )}
      {mapState === "error" && <ErrorOverlay message={errorMessage} />}
    </div>
  );
}

function LoadingOverlay({ hasTarget }: { hasTarget: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center pointer-events-none">
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-md border border-border/50">
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {hasTarget ? "Loading your district\u2026" : "Loading district boundaries\u2026"}
        </p>
      </div>
    </div>
  );
}

function GeolocationControl({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const [locating, setLocating] = useState(false);

  const handleClick = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false }
    );
  }, [onLocate]);

  return (
    <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={locating}
        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-border/50 text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        aria-label="Use my location to find your congressional district"
      >
        {locating ? (
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 rounded-full border-2 border-border" />
            <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
          </div>
        ) : (
          <Icon name="current-location" />
        )}
        {locating ? "Locating\u2026" : "Use my location"}
      </button>
      <p className="text-[10px] text-muted-foreground bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-0.5 select-none">
        Your location stays in your browser.
      </p>
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
