# Map Deep Linking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to navigate to the district map pre-centered on a specific location — from ambiguous ZIP results and from district pages.

**Architecture:** Enrich the ZIP data JSON with population-weighted centroids from HUD/Census, add content-hash cache busting to the file, then teach the map page to read query params (`lat`/`lng`/`zoom` or `state`/`district`) and adjust its initial viewport. Two navigation entry points: the ambiguous ZIP "view on map" link passes centroid coords, the district page "view on map" link passes state+district for bounds fitting.

**Tech Stack:** HUD GeoJSON API (one-time fetch during export), Astro static data, MapLibre `flyTo`/`fitBounds`, existing ZIP lookup pipeline.

---

### Task 1: Add cache-busting hash to ZIP data filename

The ZIP JSON is fetched at runtime as a bare `/data/zip-districts.json` with no content hash. Stale CDN/browser caches will serve old data when the file changes. Add a content hash to the filename during export and update the lookup module to reference it.

**Files:**

- Modify: `src/scripts/export-zips.ts`
- Modify: `src/lib/zip-lookup.ts`
- Modify: `src/lib/zip-lookup.test.ts`
- Modify: `public/_headers`

**Step 1: Update export script to write hashed filename**

In `export-zips.ts`, after generating `jsonContent`, compute a short hash and write to `zip-districts-<hash>.json`. Also write a small manifest file (`public/data/zip-manifest.json`) containing `{ "file": "zip-districts-<hash>.json" }` so the client knows which file to fetch.

```typescript
// In exportZipData, after const jsonContent = JSON.stringify(clientData):
import { createHash } from "crypto";

const hash = createHash("md5").update(jsonContent).digest("hex").slice(0, 8);
const hashedFilename = `zip-districts-${hash}.json`;
const hashedPath = join(dirname(outputPath), hashedFilename);

// Write the hashed data file
await writeFile(hashedPath, jsonContent, "utf-8");

// Write manifest pointing to hashed file
const manifestPath = join(dirname(outputPath), "zip-manifest.json");
await writeFile(manifestPath, JSON.stringify({ file: hashedFilename }), "utf-8");

// Also write the un-hashed file for backward compat during rollout
await writeFile(outputPath, jsonContent, "utf-8");
```

**Step 2: Update zip-lookup.ts to fetch via manifest**

```typescript
export async function getZipData(): Promise<ZipData> {
  if (cachedData) return cachedData;

  const manifestRes = await fetch("/data/zip-manifest.json");
  let dataUrl = "/data/zip-districts.json";
  if (manifestRes.ok) {
    const manifest = await manifestRes.json();
    dataUrl = `/data/${manifest.file}`;
  }

  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Failed to load ZIP data: ${response.statusText}`);

  cachedData = await response.json();
  return cachedData as ZipData;
}
```

**Step 3: Add cache headers for hashed data files**

In `public/_headers`:

```
/data/zip-districts-*
  Cache-Control: public, max-age=31536000, immutable

/data/zip-manifest.json
  Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600
```

The hashed file is immutable (cache forever). The manifest is cached briefly so updates propagate within an hour.

**Step 4: Update zip-lookup tests**

Update the test mock to handle the two-fetch pattern (manifest then data).

**Step 5: Run tests, verify**

Run: `pnpm test -- src/lib/zip-lookup.test.ts src/scripts/export-zips.test.ts`

**Step 6: Commit**

```
feat: add content-hash cache busting to ZIP data file
```

---

### Task 2: Enrich ZIP data with population-weighted centroids

Fetch HUD/Census centroid data during export and add `lat`/`lng` fields to each ZIP entry. This adds ~15 bytes per entry (~500KB) to the JSON.

**Files:**

- Modify: `src/scripts/export-zips.ts`
- Modify: `src/scripts/export-zips.test.ts`
- Modify: `src/lib/zip-lookup.ts` (types)

**Step 1: Write failing test for centroid enrichment**

In `export-zips.test.ts`, add test that `transformToClientFormat` includes `lat`/`lng` when centroid data is provided.

```typescript
it("includes centroid coordinates when provided", () => {
  const dbRecords: ZipDistrictDb[] = [
    { zip: "90210", state: "CA", district: "37", proportion: 1.0 },
  ];
  const centroids = new Map([["90210", { lat: 34.09, lng: -118.41 }]]);
  const result = transformToClientFormat(dbRecords, centroids);

  expect(result["90210"]).toEqual({
    s: "CA",
    d: [{ d: "37", p: 1.0 }],
    lat: 34.09,
    lng: -118.41,
  });
});

it("omits centroid fields when no centroid data available", () => {
  const dbRecords: ZipDistrictDb[] = [
    { zip: "99999", state: "AK", district: "0", proportion: 1.0 },
  ];
  const centroids = new Map<string, { lat: number; lng: number }>();
  const result = transformToClientFormat(dbRecords, centroids);

  expect(result["99999"].lat).toBeUndefined();
  expect(result["99999"].lng).toBeUndefined();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/scripts/export-zips.test.ts`

**Step 3: Add centroid fetching and enrichment**

Add `fetchZipCentroids()` function to `export-zips.ts` that fetches the HUD GeoJSON and builds a `Map<string, {lat, lng}>`:

```typescript
const HUD_CENTROIDS_URL =
  "https://opendata.arcgis.com/api/v3/datasets/d032efff520b4bf0aa620a54a477c70e_0/downloads/data?format=geojson&spatialRefId=4326&where=1%3D1";

export async function fetchZipCentroids(): Promise<Map<string, { lat: number; lng: number }>> {
  console.log("Fetching ZIP centroid data from HUD...");
  const res = await fetch(HUD_CENTROIDS_URL);
  if (!res.ok) {
    console.warn(`Failed to fetch centroids: ${res.statusText}. Proceeding without.`);
    return new Map();
  }

  const geojson = await res.json();
  const centroids = new Map<string, { lat: number; lng: number }>();

  for (const feature of geojson.features) {
    const zip = feature.properties.STD_ZIP5;
    const lat = feature.properties.LATITUDE;
    const lng = feature.properties.LONGITUDE;
    if (zip && lat != null && lng != null) {
      centroids.set(zip, {
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(lng * 1000) / 1000,
      });
    }
  }

  console.log(`Loaded ${centroids.size} ZIP centroids`);
  return centroids;
}
```

Round to 3 decimal places (~111m precision) to keep file size down.

**Step 4: Update `transformToClientFormat` signature**

Add optional `centroids` parameter. Enrich each ZIP entry with lat/lng if available:

```typescript
export interface ClientZipEntry {
  s: string;
  d: ClientDistrictEntry[];
  lat?: number;
  lng?: number;
}

export function transformToClientFormat(
  records: ZipDistrictDb[],
  centroids?: Map<string, { lat: number; lng: number }>
): ClientZipData {
  // ... existing grouping logic ...

  for (const [zip, zipRecords] of grouped) {
    // ... existing transform ...
    const centroid = centroids?.get(zip);
    result[zip] = {
      s: zipRecords[0].state,
      d: zipRecords.map((r) => ({
        d: r.district,
        p: Math.round(r.proportion * 10000) / 10000,
      })),
      ...(centroid && { lat: centroid.lat, lng: centroid.lng }),
    };
  }

  return result;
}
```

**Step 5: Update `exportZipData` to call `fetchZipCentroids`**

Call it before transform, pass the map in.

**Step 6: Update `ZipEntry` type in `zip-lookup.ts`**

```typescript
export interface ZipEntry {
  s: string;
  d: DistrictEntry[];
  lat?: number;
  lng?: number;
}
```

**Step 7: Run all tests**

Run: `pnpm test -- src/scripts/export-zips.test.ts src/lib/zip-lookup.test.ts`

**Step 8: Regenerate the ZIP data file**

Run: `export $(grep DATABASE_URL .env | xargs) && npx tsx src/scripts/export-zips.ts`

Verify the output file has lat/lng fields:

```bash
head -c 200 public/data/zip-districts.json
```

**Step 9: Commit**

```
feat: enrich ZIP data with population-weighted centroids
```

---

### Task 3: Map page reads query params and adjusts viewport

Teach the map to accept `lat`/`lng`/`zoom` query params for centroid-based navigation, and `state`/`district` for feature-bounds navigation.

**Files:**

- Modify: `src/pages/map.astro`
- Modify: `src/components/MapWithTooltip.tsx`
- Modify: `src/components/DistrictMap.tsx`
- Create: `src/components/DistrictMap.test.tsx` (if not existing — add param parsing tests)

**Step 1: Pass query params from map.astro to MapWithTooltip**

In `map.astro`, read the URL search params server-side and pass as props:

```astro
---
const lat = Astro.url.searchParams.get("lat");
const lng = Astro.url.searchParams.get("lng");
const zoom = Astro.url.searchParams.get("zoom");
const state = Astro.url.searchParams.get("state");
const district = Astro.url.searchParams.get("district");

const initialView =
  lat && lng
    ? { lat: parseFloat(lat), lng: parseFloat(lng), zoom: zoom ? parseInt(zoom, 10) : 11 }
    : undefined;

const highlightDistrict = state && district ? { state: state.toUpperCase(), district } : undefined;
---

<!-- In the component: -->
<MapWithTooltip
  client:only="react"
  initialView={initialView}
  highlightDistrict={highlightDistrict}
/>
```

**Step 2: Thread props through MapWithTooltip to DistrictMap**

Add `initialView` and `highlightDistrict` props to both components and pass them down.

**Step 3: Implement viewport adjustment in DistrictMap**

After GeoJSON loads and layers are added:

```typescript
// If initialView provided, fly to those coordinates
if (initialView) {
  map.flyTo({ center: [initialView.lng, initialView.lat], zoom: initialView.zoom, duration: 1500 });
}

// If highlightDistrict provided, find matching feature and fit bounds
if (highlightDistrict) {
  const source = map.getSource(DISTRICT_SOURCE) as maplibregl.GeoJSONSource;
  // Use querySourceFeatures after data loads
  const features = map.querySourceFeatures(DISTRICT_SOURCE, {
    filter: [
      "all",
      ["==", "STATE", stateFipsFromAbbrev(highlightDistrict.state)],
      ["==", "CD119", highlightDistrict.district],
    ],
  });
  if (features.length > 0) {
    const bounds = new maplibregl.LngLatBounds();
    for (const f of features) {
      // Extend bounds with feature geometry
      if (f.geometry.type === "Polygon") {
        for (const ring of f.geometry.coordinates) {
          for (const coord of ring) bounds.extend(coord as [number, number]);
        }
      } else if (f.geometry.type === "MultiPolygon") {
        for (const polygon of f.geometry.coordinates) {
          for (const ring of polygon) {
            for (const coord of ring) bounds.extend(coord as [number, number]);
          }
        }
      }
    }
    map.fitBounds(bounds, { padding: 40, duration: 1500 });
  }
}
```

Note: `STATE` in TIGERweb GeoJSON is a FIPS code (e.g., "06" for CA). Need a reverse lookup from state abbreviation to FIPS. We already have `FIPS_TO_STATE` in `tigerweb.ts` — add a `STATE_TO_FIPS` inverse.

**Step 4: Add `STATE_TO_FIPS` to tigerweb.ts**

```typescript
export const STATE_TO_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FIPS_TO_STATE).map(([fips, state]) => [state, fips])
);
```

**Step 5: Run typecheck and tests**

Run: `pnpm typecheck && pnpm test`

**Step 6: Commit**

```
feat: map page accepts query params for initial viewport
```

---

### Task 4: Wire up navigation links

Add the actual links that pass coordinates/district info to the map page.

**Files:**

- Modify: `src/components/ZipLookup.tsx` (ambiguous result map link)
- Modify: `src/pages/reps/[state]/[district].astro` (district page)

**Step 1: Update ambiguous ZIP "view on map" link with centroid coords**

In `ZipLookup.tsx`, the ambiguous result already shows state info. The ZIP entry from the lookup result has `lat`/`lng` now. Pass them as query params:

Update `lookupZip` return type to include centroid when ambiguous:

In `zip-lookup.ts`, update the ambiguous return to include lat/lng:

```typescript
| {
    type: "ambiguous";
    options: Array<{ state: string; district: string; proportion: number }>;
    lat?: number;
    lng?: number;
  }
```

In the ambiguous branch:

```typescript
return {
  type: "ambiguous",
  options: sortedDistricts.map((entry) => ({
    state,
    district: entry.d,
    proportion: entry.p,
  })),
  ...(zipEntry.lat != null && zipEntry.lng != null && { lat: zipEntry.lat, lng: zipEntry.lng }),
};
```

Then in `ZipLookup.tsx`, update the map link href:

```tsx
const mapUrl = result.lat != null && result.lng != null
  ? `/map?lat=${result.lat}&lng=${result.lng}&zoom=12`
  : "/map";

<a href={mapUrl} ...>View districts on map</a>
```

**Step 2: Also update the hero "Browse the district map" link**

The default hero link stays as `/map` (no params) since the user hasn't entered a ZIP yet. No change needed here.

**Step 3: Add "View on map" link to district page**

In `src/pages/reps/[state]/[district].astro`, add a link near the page header:

```astro
<a
  href={`/map?state=${state.toLowerCase()}&district=${district === "AL" || district === "0" ? "0" : district}`}
  class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
>
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    ></path>
  </svg>
  <span>View district on map</span>
</a>
```

Place this in the `PageHeader` area or right below it.

**Step 4: Run lint, typecheck, tests**

Run: `pnpm lint && pnpm typecheck && pnpm test`

**Step 5: Commit**

```
feat: wire up map deep links from ZIP results and district page
```

---

### Task 5: E2E tests for map deep linking

**Files:**

- Modify: `tests/e2e/district-map.spec.ts`

**Step 1: Add E2E tests for query param navigation**

```typescript
test("centers map when lat/lng params provided", async ({ page }) => {
  await page.goto("/map?lat=34.09&lng=-118.41&zoom=12");
  const canvas = page.locator(".map-area canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
});

test("district page has view on map link", async ({ page }) => {
  await page.goto("/reps/ca/37");
  const mapLink = page.getByRole("link", { name: /view district on map/i });
  await expect(mapLink).toBeVisible();
  await expect(mapLink).toHaveAttribute("href", /\/map\?state=ca&district=37/);
});
```

**Step 2: Run E2E locally if possible, otherwise verify in CI**

Run: `pnpm test:e2e -- tests/e2e/district-map.spec.ts`

**Step 3: Commit**

```
test: add E2E tests for map deep linking
```

---

### Task 6: Final verification

**Step 1: Run full CI check**

Run: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`

**Step 2: Verify ZIP data file is regenerated with centroids**

Check file size increased and lat/lng fields present.

**Step 3: Manual smoke test**

- Visit `/` — hero shows "or Browse the district map" link to `/map`
- Enter ambiguous ZIP (e.g., 10003) — disambiguation card shows "View districts on map" linking to `/map?lat=...&lng=...&zoom=12`
- Visit `/reps/ca/37` — "View district on map" link goes to `/map?state=ca&district=37`
- Visit `/map?lat=34.09&lng=-118.41&zoom=12` — map centers on LA area
- Visit `/map?state=CA&district=37` — map zooms to fit CA-37 boundaries

**Step 4: Commit any fixes, push**

```
chore: final verification for map deep linking
```
