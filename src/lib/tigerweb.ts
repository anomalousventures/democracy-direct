import type { FeatureCollection } from "geojson";

const TIGERWEB_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer";

export interface DistrictInfo {
  state: string;
  district: string;
  name: string;
  geoid: string;
}

export const FIPS_TO_STATE: Record<string, string> = {
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
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "78": "VI",
};

export function fipsToState(fips: string): string | undefined {
  return FIPS_TO_STATE[fips];
}

function buildQueryUrl(params: Record<string, string>): string {
  const url = new URL(`${TIGERWEB_BASE}/0/query`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function queryDistrictAtPoint(lng: number, lat: number): Promise<DistrictInfo | null> {
  try {
    const url = buildQueryUrl({
      geometry: `${lng},${lat}`,
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "STATEFP,CD119FP,NAMELSAD,GEOID",
      f: "geojson",
    });

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.features?.length) return null;

    const props = data.features[0].properties;
    return {
      state: props.STATEFP,
      district: props.CD119FP,
      name: props.NAMELSAD,
      geoid: props.GEOID,
    };
  } catch {
    return null;
  }
}

export async function getAllDistrictsGeoJSON(): Promise<FeatureCollection> {
  const url = buildQueryUrl({
    where: "1=1",
    outFields: "STATEFP,CD119FP,NAMELSAD,GEOID",
    f: "geojson",
  });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TIGERweb request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
