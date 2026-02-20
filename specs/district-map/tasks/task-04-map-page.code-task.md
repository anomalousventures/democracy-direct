---
status: completed
created: 2026-02-11
started: 2026-02-19
completed: 2026-02-19
---

# Task: Create Map Page with Lazy-Loaded Components

## Description

Create the `/map` Astro page that lazy-loads the DistrictMap and DistrictTooltip components, with preconnect hints, loading skeleton, and proper meta tags.

## Background

MapLibre GL JS is ~220KB gzipped, so the map component must be lazy-loaded to avoid impacting other pages. Astro's `client:only="react"` directive ensures the component only loads on the client (no SSR attempt). Preconnect hints for the tile server and TIGERweb improve initial load performance. The page needs a loading skeleton that shows while the large JS bundle downloads and the map initializes.

## Reference Documentation

**Required:**

- Design: docs/tasks/district-map.md (Bundle Size Strategy section, Implementation Tasks 14-15, 18)

**Additional References:**

- Existing page patterns: src/pages/
- Layout: src/layouts/Layout.astro

## Technical Requirements

1. Create `src/pages/map.astro`
2. Use `client:only="react"` for the DistrictMap component (no SSR)
3. Add preconnect hints in the page head:
   - `<link rel="preconnect" href="https://tiles.stadiamaps.com" />`
   - `<link rel="preconnect" href="https://tigerweb.geo.census.gov" />`
4. Display a loading skeleton that shows before the map component hydrates
5. Set appropriate meta tags (title: "District Map", description about finding your representative)
6. Add tile provider attribution (Stadia Maps) in the map area or footer
7. Use the existing Layout component for consistent page structure
8. Wire up DistrictMap's `onDistrictSelect` callback to show/hide the DistrictTooltip
9. Page should be full-width or near-full-width for the map area

## Dependencies

- task-02 (DistrictMap component)
- task-03 (DistrictTooltip component)

## Implementation Approach

1. Create `src/pages/map.astro`:

   ```astro
   ---
   import Layout from "@/layouts/Layout.astro";
   import DistrictMap from "@/components/DistrictMap";
   ---

   <Layout
     title="District Map"
     description="Find your congressional district and representative on an interactive map"
   >
     <link slot="head" rel="preconnect" href="https://tiles.stadiamaps.com" />
     <link slot="head" rel="preconnect" href="https://tigerweb.geo.census.gov" />

     <main>
       <h1>Congressional District Map</h1>
       <div class="map-container">
         <DistrictMap client:only="react" />
       </div>
       <p class="attribution">
         Map tiles by <a href="https://stadiamaps.com/">Stadia Maps</a>. District data from <a
           href="https://tigerweb.geo.census.gov/">U.S. Census Bureau</a
         >.
       </p>
     </main>
   </Layout>
   ```

2. For the loading skeleton:
   - The `client:only` directive means the component slot is empty until JS loads
   - Add a CSS skeleton/placeholder in the map container that shows by default
   - The DistrictMap component renders over it once hydrated
3. Manage tooltip state:
   - Create a wrapper React component (e.g., `MapWithTooltip.tsx`) that contains both DistrictMap and DistrictTooltip
   - Or use Astro's island architecture with a shared state approach
   - The wrapper holds `selectedDistrict` state and passes it between map and tooltip
4. Style the map container to take up most of the viewport height

## Acceptance Criteria

1. **Page available at /map**
   - Given the site is running
   - When navigating to `/map`
   - Then the map page renders

2. **Map loaded via client:only**
   - Given the page source
   - When the DistrictMap component directive is reviewed
   - Then it uses `client:only="react"` (no SSR)

3. **Preconnect hints present**
   - Given the page HTML head
   - When link tags are inspected
   - Then preconnect hints exist for tiles.stadiamaps.com and tigerweb.geo.census.gov

4. **Loading skeleton visible**
   - Given the page loads
   - When JS is still downloading
   - Then a loading skeleton/placeholder is visible in the map area

5. **Meta tags set**
   - Given the page HTML
   - When meta tags are inspected
   - Then title contains "District Map" and description mentions finding representatives

6. **Attribution displayed**
   - Given the page renders
   - When the map area is inspected
   - Then tile provider (Stadia Maps) and data source (Census Bureau) attribution are visible

7. **Tooltip integration works**
   - Given the map is interactive
   - When a district is clicked
   - Then the DistrictTooltip appears with district and rep info

8. **Map area fills viewport**
   - Given the page renders
   - When the map container is inspected
   - Then it takes up a significant portion of the viewport height

## Metadata

- **Complexity**: Medium
- **Labels**: ui, astro, district-map, performance
- **Required Skills**: Astro, React islands, CSS, lazy loading
