---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Create DistrictMap React Component with Error Handling

## Description

Install MapLibre GL JS and create the main DistrictMap React component that renders an interactive map with congressional district boundaries from TIGERweb. Includes loading states and error handling.

## Background

MapLibre GL JS (~220KB gzipped) is an open-source vector tile map library. It will use Stadia Maps as the free base tile provider (no API key needed for small usage). District boundaries are fetched from TIGERweb as GeoJSON and rendered as a semi-transparent fill layer with visible borders. Click events trigger district identification via the TIGERweb API. The component is client-only (no SSR) since MapLibre requires the DOM.

## Reference Documentation

**Required:**

- Design: docs/tasks/district-map.md (Implementation Tasks section, Bundle Size Strategy section, Free Base Map Tile Providers section)

**Additional References:**

- TIGERweb wrapper from task-01: src/lib/tigerweb.ts

## Technical Requirements

1. Install `maplibre-gl` as a project dependency
2. Create `src/components/DistrictMap.tsx` as a client-only React component
3. Initialize MapLibre GL JS with Stadia Maps base tiles
4. Center map on continental US by default (approximately -98.5, 39.8, zoom 4)
5. Fetch district GeoJSON from TIGERweb (`getAllDistrictsGeoJSON`) on map load
6. Add district boundaries as a MapLibre source and fill layer:
   - Semi-transparent fill (e.g., rgba with 0.1-0.2 opacity)
   - Visible border lines (e.g., 1-2px, darker color)
7. Add click handler on the map that:
   - Gets the clicked coordinates
   - Calls `queryDistrictAtPoint(lng, lat)`
   - Passes result to a callback prop (for tooltip/popup integration)
8. Show loading state while GeoJSON is being fetched
9. Handle TIGERweb errors gracefully:
   - Show user-friendly error message if district boundary fetch fails
   - Suggest ZIP code lookup as fallback alternative
   - Map remains interactive even if district overlay fails
   - Error state is visually distinct from loading state
   - Network timeout handling (don't show infinite loading)
10. Import MapLibre CSS for proper map rendering
11. Clean up map instance on component unmount

## Dependencies

- task-01 (TIGERweb wrapper)

## Implementation Approach

1. Install: `pnpm add maplibre-gl`
2. Create `src/components/DistrictMap.tsx`:
   - Use `useRef` for map container div and map instance
   - Use `useEffect` to initialize map on mount and clean up on unmount
   - Import `maplibre-gl/dist/maplibre-gl.css` for map styles
   - Initialize with Stadia Maps style URL: `https://tiles.stadiamaps.com/styles/alidade_smooth.json`
   - After map loads, call `getAllDistrictsGeoJSON()`:
     - On success: add as GeoJSON source, add fill + line layers
     - On failure: set error state, show fallback message
   - Add `click` event listener on the map:
     - Extract lng/lat from click event
     - Call `queryDistrictAtPoint(lng, lat)`
     - Pass result to `onDistrictSelect` callback prop
   - Use AbortController for fetch timeout (e.g., 15 seconds)
   - Manage state: `loading`, `error`, `ready`
3. Render structure:
   - Map container div (full width/height of parent)
   - Loading overlay when `loading` is true
   - Error overlay when `error` is true (with ZIP lookup link)
   - Map renders underneath in all states
4. Props interface:
   - `onDistrictSelect?: (district: DistrictInfo | null) => void`
   - `className?: string`

## Acceptance Criteria

1. **MapLibre installed**
   - Given package.json
   - When dependencies are reviewed
   - Then `maplibre-gl` is listed

2. **Map initializes with base tiles**
   - Given the component mounts
   - When the map renders
   - Then Stadia Maps tiles are displayed as the base layer

3. **Map centered on continental US**
   - Given the component mounts
   - When the initial viewport is checked
   - Then the map is centered approximately on the continental US

4. **District boundaries rendered**
   - Given TIGERweb returns GeoJSON successfully
   - When the map loads
   - Then district boundaries appear as a semi-transparent fill layer with visible borders

5. **Click triggers district identification**
   - Given the map is rendered with district data
   - When a user clicks on the map
   - Then `queryDistrictAtPoint` is called with the clicked coordinates

6. **onDistrictSelect callback fires**
   - Given a click returns district data
   - When the query completes
   - Then the `onDistrictSelect` prop callback is called with the DistrictInfo

7. **Loading state shown**
   - Given the component is mounted
   - When GeoJSON is being fetched
   - Then a loading indicator is visible

8. **Error state on TIGERweb failure**
   - Given TIGERweb fetch fails
   - When the error state renders
   - Then a user-friendly message is shown suggesting ZIP code lookup

9. **Map remains interactive on overlay failure**
   - Given the district GeoJSON fails to load
   - When the map is in error state
   - Then the base map tiles still render and are pannable/zoomable

10. **Timeout handling**
    - Given TIGERweb takes too long to respond
    - When the timeout threshold is reached
    - Then the request is aborted and error state is shown (not infinite loading)

11. **Cleanup on unmount**
    - Given the component unmounts
    - When React cleanup runs
    - Then the map instance is destroyed and no memory leaks occur

## Metadata

- **Complexity**: High
- **Labels**: ui, react, maplibre, geospatial, district-map
- **Required Skills**: React, MapLibre GL JS, GeoJSON, CSS
