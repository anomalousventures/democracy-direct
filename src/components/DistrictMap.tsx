import { useState, useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  getAllDistrictsGeoJSON,
  getDistrictsForBBox,
  STATE_TO_FIPS,
  type DistrictInfo,
} from "@/lib/tigerweb";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";

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
const FETCH_TIMEOUT_MS = 30_000;

const DISTRICT_SOURCE = "districts";
const DISTRICT_FILL_LAYER = "district-fill";
const DISTRICT_LINE_LAYER = "district-line";

const DETAIL_TIERS = [
  { minZoom: 6, offset: "0.005" },
  { minZoom: 8, offset: "0.002" },
  { minZoom: 10, offset: "0.0005" },
  { minZoom: 12, offset: "0.0001" },
] as const;

function getOffsetForZoom(zoom: number): string | null {
  for (let i = DETAIL_TIERS.length - 1; i >= 0; i--) {
    if (zoom >= DETAIL_TIERS[i].minZoom) return DETAIL_TIERS[i].offset;
  }
  return null;
}

function fitBoundsToDistrict(
  map: maplibregl.Map,
  geojson: FeatureCollection,
  highlight: HighlightDistrict
) {
  const fips = STATE_TO_FIPS[highlight.state];
  if (!fips) return;

  const cd = highlight.district.padStart(2, "0");
  const bounds = new maplibregl.LngLatBounds();
  let found = false;

  for (const feature of geojson.features) {
    const props = feature.properties;
    if (!props || props.STATE !== fips || props.CD119 !== cd) continue;

    found = true;
    const geom = feature.geometry as Polygon | MultiPolygon;
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        for (const coord of ring) bounds.extend(coord as [number, number]);
      }
    } else if (geom.type === "MultiPolygon") {
      for (const polygon of geom.coordinates) {
        for (const ring of polygon) {
          for (const coord of ring) bounds.extend(coord as [number, number]);
        }
      }
    }
  }

  if (found) {
    map.fitBounds(bounds, { padding: 40, duration: 1500 });
  }
}

export function DistrictMap({
  onDistrictSelect,
  className,
  initialView,
  highlightDistrict,
}: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredIdRef = useRef<number | null>(null);
  const currentOffsetRef = useRef<string | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  const coarseGeoJsonRef = useRef<FeatureCollection | null>(null);
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
      onDistrictSelect({
        state: props.STATE,
        district: String(parseInt(props.CD119, 10)),
        name: props.NAME,
        geoid: props.GEOID,
      });
    },
    [onDistrictSelect]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
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

        map.addSource(DISTRICT_SOURCE, {
          type: "geojson",
          data: geojson,
          generateId: true,
        });

        map.addLayer({
          id: DISTRICT_FILL_LAYER,
          type: "fill",
          source: DISTRICT_SOURCE,
          paint: {
            "fill-color": "#1e3a5f",
            "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.3, 0.12],
          },
        });

        map.addLayer({
          id: DISTRICT_LINE_LAYER,
          type: "line",
          source: DISTRICT_SOURCE,
          paint: {
            "line-color": "#1e3a5f",
            "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.6],
            "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.5, 1.5],
          },
        });

        map.on("mousemove", DISTRICT_FILL_LAYER, (e) => {
          if (e.features && e.features.length > 0) {
            const id = e.features[0].id as number;
            if (hoveredIdRef.current !== null && hoveredIdRef.current !== id) {
              map.setFeatureState(
                { source: DISTRICT_SOURCE, id: hoveredIdRef.current },
                { hover: false }
              );
            }
            hoveredIdRef.current = id;
            map.setFeatureState({ source: DISTRICT_SOURCE, id }, { hover: true });
            map.getCanvas().style.cursor = "pointer";
          }
        });

        map.on("mouseleave", DISTRICT_FILL_LAYER, () => {
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: DISTRICT_SOURCE, id: hoveredIdRef.current },
              { hover: false }
            );
            hoveredIdRef.current = null;
          }
          map.getCanvas().style.cursor = "";
        });

        coarseGeoJsonRef.current = geojson;

        map.on("moveend", async () => {
          const zoom = map.getZoom();
          const source = map.getSource(DISTRICT_SOURCE) as maplibregl.GeoJSONSource | undefined;
          if (!source) return;

          const neededOffset = getOffsetForZoom(zoom);

          if (!neededOffset) {
            if (currentOffsetRef.current !== null && coarseGeoJsonRef.current) {
              source.setData(coarseGeoJsonRef.current);
              currentOffsetRef.current = null;
            }
            return;
          }

          detailAbortRef.current?.abort();
          const controller = new AbortController();
          detailAbortRef.current = controller;

          try {
            const bounds = map.getBounds();
            const detailed = await getDistrictsForBBox(
              {
                west: bounds.getWest(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                north: bounds.getNorth(),
              },
              neededOffset,
              controller.signal
            );
            if (!controller.signal.aborted) {
              const seen = new Set<string>();
              detailed.features = detailed.features.filter((f) => {
                const geoid = f.properties?.GEOID;
                if (!geoid || seen.has(geoid)) return false;
                seen.add(geoid);
                return true;
              });
              source.setData(detailed);
              currentOffsetRef.current = neededOffset;
            }
          } catch {
            // Silently keep current resolution
          }
        });

        if (initialView) {
          map.flyTo({
            center: [initialView.lng, initialView.lat],
            zoom: initialView.zoom,
            duration: 1500,
          });
        } else if (highlightDistrict) {
          fitBoundsToDistrict(map, geojson, highlightDistrict);
        }

        setMapState("ready");
      } catch (err) {
        clearTimeout(timeoutId);
        if (abortController.signal.aborted) return;
        const message =
          err instanceof DOMException && err.name === "AbortError"
            ? "District data took too long to load."
            : "Could not load district boundaries.";
        setErrorMessage(message);
        setMapState("error");
      }
    });

    map.on("click", DISTRICT_FILL_LAYER, handleMapClick);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
      detailAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
    };
  }, [handleMapClick]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="w-full h-full"
        role="application"
        aria-label="Interactive congressional district map. Use arrow keys to pan, plus and minus to zoom."
        tabIndex={0}
      />

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
