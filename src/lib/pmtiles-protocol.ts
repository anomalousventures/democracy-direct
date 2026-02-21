import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";

let protocol: Protocol | null = null;

export function ensurePmtilesProtocol(): void {
  if (protocol) return;
  protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
}
