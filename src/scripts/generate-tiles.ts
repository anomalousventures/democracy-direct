import { writeFile, mkdir, unlink, rename } from "fs/promises";
import { execFileSync } from "child_process";
import { join, dirname } from "path";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";

const TIGERWEB_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer";

const OUTPUT_PMTILES = "public/data/districts.pmtiles";
const OUTPUT_BOUNDS = "public/data/district-bounds.json";

type BoundsRecord = Record<string, [number, number, number, number]>;

function buildQueryUrl(params: Record<string, string>): string {
  const url = new URL(`${TIGERWEB_BASE}/0/query`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function fetchFullResolutionGeoJSON(): Promise<FeatureCollection> {
  console.log("Fetching full-resolution district GeoJSON from TIGERweb...");

  const url = buildQueryUrl({
    where: "1=1",
    outFields: "STATE,CD119,NAME,GEOID",
    returnGeometry: "true",
    maxAllowableOffset: "0.0001",
    f: "geojson",
  });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TIGERweb request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`TIGERweb query error: ${data.error.message}`);
  }

  console.log(`Fetched ${data.features?.length ?? 0} district features`);
  return data as FeatureCollection;
}

export function computeDistrictBounds(geojson: FeatureCollection): BoundsRecord {
  const bounds: BoundsRecord = {};

  for (const feature of geojson.features) {
    const geoid = feature.properties?.GEOID;
    if (!geoid) continue;

    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;

    const geom = feature.geometry as Polygon | MultiPolygon;
    const rings =
      geom.type === "Polygon" ? geom.coordinates : geom.coordinates.flatMap((polygon) => polygon);

    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < west) west = lng;
        if (lng > east) east = lng;
        if (lat < south) south = lat;
        if (lat > north) north = lat;
      }
    }

    if (west !== Infinity) {
      bounds[geoid] = [
        Math.round(west * 1e6) / 1e6,
        Math.round(south * 1e6) / 1e6,
        Math.round(east * 1e6) / 1e6,
        Math.round(north * 1e6) / 1e6,
      ];
    }
  }

  return bounds;
}

export async function generateTiles(): Promise<void> {
  const geojson = await fetchFullResolutionGeoJSON();

  console.log("Computing district bounding boxes...");
  const bounds = computeDistrictBounds(geojson);
  const boundCount = Object.keys(bounds).length;
  console.log(`Computed bounds for ${boundCount} districts`);

  await mkdir(dirname(OUTPUT_BOUNDS), { recursive: true });
  await writeFile(OUTPUT_BOUNDS, JSON.stringify(bounds), "utf-8");
  console.log(`Wrote ${OUTPUT_BOUNDS}`);

  const tmpGeojson = join(dirname(OUTPUT_PMTILES), "districts-tmp.geojson");
  await writeFile(tmpGeojson, JSON.stringify(geojson), "utf-8");
  console.log(
    `Wrote temp GeoJSON (${(Buffer.byteLength(JSON.stringify(geojson)) / 1024 / 1024).toFixed(1)} MB)`
  );

  const tmpPmtiles = join(dirname(OUTPUT_PMTILES), "districts-tmp.pmtiles");

  try {
    console.log("Running tippecanoe...");
    execFileSync(
      "tippecanoe",
      [
        "-o",
        tmpPmtiles,
        "--layer=districts",
        "--minimum-zoom=0",
        "--maximum-zoom=12",
        "--simplification=10",
        "--detect-shared-borders",
        "--coalesce-smallest-as-needed",
        "--no-tile-size-limit",
        "--force",
        tmpGeojson,
      ],
      { stdio: "inherit" }
    );

    await rename(tmpPmtiles, OUTPUT_PMTILES);
    console.log(`Wrote ${OUTPUT_PMTILES}`);
  } finally {
    await unlink(tmpGeojson).catch(() => {});
    await unlink(tmpPmtiles).catch(() => {});
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateTiles()
    .then(() => {
      console.log("Tile generation complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Tile generation failed:", error);
      process.exit(1);
    });
}
