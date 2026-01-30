# District Map

## Status: Ready

## Problem Statement

Users may not know their congressional district number. A map-based interface would let them click their location to find their district, providing a more intuitive alternative to ZIP code lookup. Maps also help visualize district boundaries for civic education.

## Research Completed

- [x] Evaluate map libraries (Mapbox, Leaflet, MapLibre, OpenLayers)
  - **MapLibre GL JS RECOMMENDED** - open source, vector tiles, good performance
  - Leaflet: simpler but ~40KB, raster-based
  - Mapbox GL JS: proprietary license since v2 (2020)
  - OpenLayers: powerful but steeper learning curve
- [x] Evaluate congressional district data sources
  - **TIGERweb MapServer RECOMMENDED** - official Census Bureau service
  - Layer 0: 119th Congressional Districts (current!)
  - Supports GeoJSON query output
  - No API key, no rate limits, always up to date
  - Query/Identify endpoints for click-to-identify
- [x] Analyze bundle size impact
  - MapLibre GL JS: ~220KB gzipped
  - **No GeoJSON hosting needed** - query TIGERweb on demand
  - **Mitigation**: dynamic import, lazy load map component

## Open Questions - Resolved

| Question                | Decision                          | Rationale                                     |
| ----------------------- | --------------------------------- | --------------------------------------------- |
| Which library?          | **MapLibre GL JS**                | Open source, vector tiles, active development |
| Data source?            | **TIGERweb MapServer**            | Official, always current, no hosting needed   |
| Self-host GeoJSON?      | **No**                            | Query TIGERweb directly, simpler architecture |
| Full page or embedded?  | **Dedicated page + embed option** | Maximum flexibility                           |
| Show rep info on hover? | **Yes, tooltip with name/party**  | Quick context without navigating              |

## TIGERweb Service Details

**Base URL:** `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer`

**Key Layers:**

- Layer 0: 119th Congressional Districts (current)
- Layer 1: State Legislative Districts - Upper
- Layer 2: State Legislative Districts - Lower

**Useful Endpoints:**

- `/0/query` - Query districts by geometry or attributes
- `/identify` - Click-to-identify district at coordinates
- `/export` - Get map image tiles

**Query Example:**

```
/0/query?where=1=1&outFields=*&f=geojson
→ Returns all districts as GeoJSON

/0/query?geometry=-122.4,37.8&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&f=geojson
→ Returns district containing point (lng, lat)
```

**Response Fields:**

- `STATEFP` - State FIPS code
- `CD119FP` - District number (00 = at-large)
- `NAMELSAD` - Full name ("Congressional District 12")
- `GEOID` - Unique ID (state + district)

## Proposed Approach

1. Create map page with MapLibre GL JS (lazy loaded)
2. Load district boundaries from TIGERweb as GeoJSON source
3. Style districts with semi-transparent fill
4. On click, query TIGERweb identify endpoint for district info
5. Show tooltip and link to rep page

## Implementation Tasks

1. Install MapLibre GL JS: `pnpm add maplibre-gl`
2. Create `src/lib/tigerweb.ts` with typed API wrapper for TIGERweb queries
3. Add `queryDistrictAtPoint(lng, lat)` function returning district info
4. Add `getAllDistricts()` function returning GeoJSON FeatureCollection
5. Create `src/components/DistrictMap.tsx` as lazy-loaded React component
6. Set up MapLibre with free base tile provider (Stadia Maps or MapTiler free tier)
7. Fetch district GeoJSON from TIGERweb on map load
8. Add district layer with semi-transparent fill, visible borders
9. Style districts by state or party (optional color coding)
10. Add click handler that queries TIGERweb identify endpoint
11. Create `src/components/DistrictTooltip.tsx` showing state, district, rep info
12. Query local database to get rep name/party for district (join on state + district)
13. Add "View Representative →" link in tooltip navigating to rep page
14. Create `src/pages/map.astro` as the map page
15. Add dynamic import wrapper in Astro for client-only loading
16. Add "Find on map" link to ZIP lookup results page
17. Add map link to main navigation
18. Add loading skeleton while map and data load
19. Handle TIGERweb errors gracefully (show message, suggest ZIP lookup)
20. Add e2e test in `tests/e2e/district-map.spec.ts` for click-to-navigate flow

## TIGERweb API Wrapper

```typescript
// src/lib/tigerweb.ts
const TIGERWEB_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer";

interface DistrictInfo {
  state: string; // e.g., "06" (FIPS)
  district: string; // e.g., "12" or "00" for at-large
  name: string; // e.g., "Congressional District 12"
  geoid: string; // e.g., "0612"
}

export async function queryDistrictAtPoint(lng: number, lat: number): Promise<DistrictInfo | null> {
  const url = new URL(`${TIGERWEB_BASE}/0/query`);
  url.searchParams.set("geometry", `${lng},${lat}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "STATEFP,CD119FP,NAMELSAD,GEOID");
  url.searchParams.set("f", "geojson");

  const res = await fetch(url);
  const data = await res.json();

  if (!data.features?.length) return null;

  const props = data.features[0].properties;
  return {
    state: props.STATEFP,
    district: props.CD119FP,
    name: props.NAMELSAD,
    geoid: props.GEOID,
  };
}

export async function getAllDistrictsGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  const url = new URL(`${TIGERWEB_BASE}/0/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "STATEFP,CD119FP,NAMELSAD,GEOID");
  url.searchParams.set("f", "geojson");

  const res = await fetch(url);
  return res.json();
}
```

## Bundle Size Strategy

MapLibre is ~220KB which is significant. Mitigate with:

1. **Dynamic import**: Only load when user visits `/map`
2. **No SSR**: Map component is client-only
3. **No local GeoJSON**: Fetch from TIGERweb on demand
4. **Preconnect**: Add hints for tile server and TIGERweb

```astro
<!-- In map.astro head -->
<link rel="preconnect" href="https://tiles.stadiamaps.com" />
<link rel="preconnect" href="https://tigerweb.geo.census.gov" />
```

## Free Base Map Tile Providers

| Provider    | Free Tier     | Notes                                |
| ----------- | ------------- | ------------------------------------ |
| Stadia Maps | 200k tiles/mo | No API key for small usage           |
| MapTiler    | 100k loads/mo | Good free tier, requires attribution |
| OpenFreeMap | Unlimited     | Community project                    |

**Recommendation**: Stadia Maps - no API key needed for small sites.

## State FIPS to Abbreviation

Need mapping to convert TIGERweb FIPS codes to state abbreviations for rep lookup:

```typescript
const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  // ... etc
};
```

## Verification

- [ ] Map loads without blocking page render
- [ ] District boundaries display correctly from TIGERweb
- [ ] Click identifies correct district
- [ ] Tooltip shows district name and rep info
- [ ] "View Representative" link navigates correctly
- [ ] Works on mobile (touch interaction)
- [ ] Handles TIGERweb errors gracefully
- [ ] Map is accessible (keyboard navigation)
- [ ] Bundle size impact is acceptable (<250KB additional)
- [ ] Performance is smooth on mid-range devices
- [ ] Attribution for tile provider is displayed
- [ ] Navigation includes map link
- [ ] E2E tests pass
