---
status: completed
created: 2026-02-11
started: 2026-02-19
completed: 2026-02-19
---

# Task: Create TIGERweb API Wrapper

## Description

Create a typed TypeScript module wrapping the Census Bureau's TIGERweb MapServer API for querying congressional district boundaries and identifying districts at geographic coordinates. Includes FIPS-to-state-abbreviation mapping and comprehensive unit tests.

## Background

TIGERweb is the Census Bureau's official geographic service. Layer 0 of the Legislative MapServer provides 119th Congressional District boundaries. The service supports GeoJSON output, requires no API key, and has no rate limits. Two key operations are needed: querying a district at a specific coordinate point, and fetching all district boundaries as a GeoJSON FeatureCollection. The FIPS-to-state mapping is needed to translate Census FIPS codes (e.g., "06") to state abbreviations (e.g., "CA") used in the legislators table.

## Reference Documentation

**Required:**

- Design: docs/tasks/district-map.md (TIGERweb Service Details section, State FIPS to Abbreviation section, TIGERweb API Wrapper section)

## Technical Requirements

1. Create `src/lib/tigerweb.ts`
2. Define `DistrictInfo` type: `{ state: string, district: string, name: string, geoid: string }`
3. Export `queryDistrictAtPoint(lng: number, lat: number): Promise<DistrictInfo | null>`
   - Queries TIGERweb Layer 0 with point geometry
   - Returns district info or null if no district found (ocean, outside US)
   - Requests fields: STATEFP, CD119FP, NAMELSAD, GEOID
4. Export `getAllDistrictsGeoJSON(): Promise<GeoJSON.FeatureCollection>`
   - Queries all districts with `where=1=1`
   - Returns complete GeoJSON FeatureCollection
5. Export `FIPS_TO_STATE` mapping covering all 50 states + DC + territories (PR, GU, VI, AS, MP)
6. Export `fipsToState(fips: string): string | undefined` helper function
7. Handle fetch errors gracefully (return null / throw with clear message)
8. Write comprehensive unit tests

## Dependencies

- None (this is the first task in the district map feature)

## Implementation Approach

1. Create `src/lib/tigerweb.ts`:
   - Define the base URL constant: `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer`
   - Implement `queryDistrictAtPoint`:
     - Construct URL with `geometry={lng},{lat}`, `geometryType=esriGeometryPoint`, `spatialRel=esriSpatialRelIntersects`, `outFields=STATEFP,CD119FP,NAMELSAD,GEOID`, `f=geojson`
     - Parse response, return first feature's properties mapped to DistrictInfo
     - Return null if no features in response
   - Implement `getAllDistrictsGeoJSON`:
     - Construct URL with `where=1=1`, `outFields=STATEFP,CD119FP,NAMELSAD,GEOID`, `f=geojson`
     - Return parsed GeoJSON
   - Define `FIPS_TO_STATE` as a complete Record<string, string> covering all 56 FIPS codes
   - Implement `fipsToState` as a simple lookup
2. Create `src/lib/tigerweb.test.ts`:
   - Mock `globalThis.fetch`
   - Test `queryDistrictAtPoint` with successful response (returns DistrictInfo)
   - Test `queryDistrictAtPoint` with empty features (returns null - point in ocean)
   - Test `queryDistrictAtPoint` with fetch error (returns null)
   - Test `queryDistrictAtPoint` URL construction (correct coordinates, params)
   - Test `getAllDistrictsGeoJSON` with successful response
   - Test `getAllDistrictsGeoJSON` with fetch error
   - Test `FIPS_TO_STATE` covers all 50 states + DC
   - Test `fipsToState` for known values ("06" -> "CA", "36" -> "NY")
   - Test `fipsToState` for unknown FIPS code returns undefined
   - Test at-large district handling (CD119FP = "00")
3. Run `pnpm test -- src/lib/tigerweb` to verify

## Acceptance Criteria

1. **queryDistrictAtPoint exported**
   - Given `src/lib/tigerweb.ts`
   - When exports are reviewed
   - Then `queryDistrictAtPoint` is exported with `(lng, lat)` signature returning `Promise<DistrictInfo | null>`

2. **Successful point query returns DistrictInfo**
   - Given a mocked TIGERweb response with one feature
   - When `queryDistrictAtPoint` is called
   - Then it returns a DistrictInfo object with state, district, name, and geoid

3. **Empty result returns null**
   - Given a mocked TIGERweb response with no features
   - When `queryDistrictAtPoint` is called
   - Then it returns null

4. **Fetch errors handled**
   - Given a mocked fetch failure
   - When `queryDistrictAtPoint` is called
   - Then it returns null without throwing

5. **getAllDistrictsGeoJSON returns FeatureCollection**
   - Given a mocked successful response
   - When `getAllDistrictsGeoJSON` is called
   - Then it returns a GeoJSON FeatureCollection

6. **FIPS mapping complete**
   - Given the `FIPS_TO_STATE` mapping
   - When all 50 states + DC are checked
   - Then each has a correct mapping (e.g., "06" -> "CA", "11" -> "DC")

7. **fipsToState helper works**
   - Given known FIPS codes
   - When `fipsToState` is called
   - Then it returns the correct state abbreviation or undefined for unknown codes

8. **URL construction correct**
   - Given coordinates (-122.4, 37.8)
   - When the fetch URL is inspected in tests
   - Then it contains the correct geometry parameter and query string

9. **All tests pass**
   - Given the test suite
   - When `pnpm test -- src/lib/tigerweb` runs
   - Then all tests pass

## Metadata

- **Complexity**: Medium
- **Labels**: api, geospatial, district-map, testing
- **Required Skills**: TypeScript, fetch API, GeoJSON, Vitest
