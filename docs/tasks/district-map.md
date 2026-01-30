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
- [x] Evaluate congressional district GeoJSON sources
  - **unitedstates/districts** - public domain, current districts
  - JeffreyBLewis/congressional-district-boundaries - historical + current
  - US Census TIGER files - official source, larger files
- [x] Analyze bundle size impact
  - MapLibre GL JS: ~220KB gzipped (larger than Leaflet's 40KB)
  - District GeoJSON: ~5-10MB raw, ~1-2MB simplified
  - **Mitigation**: dynamic import, lazy load map component
- [x] Determine feature scope for MVP
  - Click to identify district
  - Link to rep page from clicked district
  - Optional: show all district boundaries colored by party

## Open Questions - Resolved

| Question                | Decision                          | Rationale                                     |
| ----------------------- | --------------------------------- | --------------------------------------------- |
| Which library?          | **MapLibre GL JS**                | Open source, vector tiles, active development |
| GeoJSON source?         | **unitedstates/districts**        | Public domain, current, well-maintained       |
| Simplify geometry?      | **Yes, use mapshaper**            | Reduce file size for web                      |
| Self-host tiles?        | **No, use free tile providers**   | Simpler, no infrastructure cost               |
| Full page or embedded?  | **Dedicated page + embed option** | Maximum flexibility                           |
| Show rep info on hover? | **Yes, tooltip with name/party**  | Quick context without navigating              |

## Proposed Approach

1. Create map page with MapLibre GL JS (lazy loaded)
2. Download and simplify district GeoJSON
3. Overlay districts on base map with click handlers
4. Show tooltip on hover with district info
5. Link to rep page on click
6. Optionally color districts by party

## Implementation Tasks

1. Install MapLibre GL JS: `pnpm add maplibre-gl`
2. Download current district GeoJSON from unitedstates/districts repo
3. Simplify GeoJSON using mapshaper CLI to reduce file size (target: <2MB)
4. Store simplified GeoJSON in `public/data/districts.geojson`
5. Create `src/components/DistrictMap.tsx` as lazy-loaded React component
6. Set up MapLibre with free tile provider (e.g., MapTiler free tier, or Stadia Maps)
7. Add district layer to map from GeoJSON source
8. Style districts with semi-transparent fill, visible borders
9. Add hover handler showing tooltip with state, district number, and rep name
10. Add click handler navigating to `/reps/[state]/[district]` or `/rep/[bioguideId]`
11. Create `src/pages/map.astro` as the map page
12. Add dynamic import wrapper in Astro page for client-only loading
13. Create `src/db/queries/districts.ts` with `getRepsByDistrict(state, district)` query
14. Add API endpoint `/api/district/[state]/[district]` returning rep info for map tooltips
15. Add "Find on map" link to ZIP lookup results page
16. Add map link to main navigation
17. Add loading skeleton/spinner while map initializes
18. Test performance on mobile devices
19. Add e2e test in `tests/e2e/district-map.spec.ts` for click-to-navigate flow

## Bundle Size Strategy

MapLibre is ~220KB which is significant. Mitigate with:

1. **Dynamic import**: Only load when user visits `/map`
2. **No SSR**: Map component is client-only
3. **Lazy load GeoJSON**: Fetch after map initializes
4. **Preconnect**: Add preconnect hints for tile server

```astro
<!-- In map.astro -->
<script>
  // Dynamic import - only loads when needed
  const { DistrictMap } = await import("../components/DistrictMap");
</script>
```

## Free Tile Providers

| Provider    | Free Tier     | Notes                                |
| ----------- | ------------- | ------------------------------------ |
| MapTiler    | 100k loads/mo | Good free tier, requires attribution |
| Stadia Maps | 200k tiles/mo | No API key for small usage           |
| CartoCDN    | Limited       | Attribution required                 |
| OpenFreeMap | Unlimited     | Community project, may be unstable   |

**Recommendation**: Start with Stadia Maps for simplicity (no API key needed for small sites), upgrade to MapTiler if traffic grows.

## GeoJSON Processing

```bash
# Download current districts
curl -O https://raw.githubusercontent.com/unitedstates/districts/gh-pages/cds/2024/all-states.geojson

# Simplify with mapshaper (install: npm install -g mapshaper)
mapshaper all-states.geojson -simplify 10% -o format=geojson districts.geojson

# Check file size
ls -lh districts.geojson
```

Target: <2MB after simplification (original may be 10-15MB).

## UI Components

### DistrictMap

- Full viewport map with zoom controls
- Semi-transparent district fill (varies by party?)
- Hover: tooltip with "CA-12: Nancy Pelosi (D)"
- Click: navigate to rep page

### MapTooltip

- District name: "California District 12"
- Rep name and party: "Rep. Nancy Pelosi (D)"
- Small link: "View profile →"

## Verification

- [ ] Map loads without blocking page render
- [ ] District boundaries display correctly
- [ ] Hover shows district tooltip with rep info
- [ ] Click navigates to rep page
- [ ] Works on mobile (touch interaction)
- [ ] Map is accessible (keyboard navigation)
- [ ] Bundle size impact is acceptable (<250KB additional)
- [ ] Performance is smooth on mid-range devices
- [ ] Attribution for tile provider is displayed
- [ ] Navigation includes map link
- [ ] E2E tests pass
