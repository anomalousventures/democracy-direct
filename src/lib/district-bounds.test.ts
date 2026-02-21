import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDistrictBounds, resetBoundsCache } from "./district-bounds";

const SAMPLE_BOUNDS = {
  "0637": [-122.42, 37.12, -121.86, 37.56],
  "4801": [-97.5, 30.1, -96.8, 30.9],
  "1198": [-77.12, 38.79, -76.91, 38.99],
  "0200": [-179.15, 51.21, -129.98, 71.39],
};

beforeEach(() => {
  vi.restoreAllMocks();
  resetBoundsCache();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SAMPLE_BOUNDS),
    })
  );
});

describe("getDistrictBounds", () => {
  it("returns bounds for a valid state and district", async () => {
    const bounds = await getDistrictBounds("CA", "37");
    expect(bounds).toEqual([-122.42, 37.12, -121.86, 37.56]);
  });

  it("pads single-digit district numbers", async () => {
    const bounds = await getDistrictBounds("TX", "1");
    expect(bounds).toEqual([-97.5, 30.1, -96.8, 30.9]);
  });

  it("resolves DC at-large (district 0) via CD119=98 key", async () => {
    const bounds = await getDistrictBounds("DC", "0");
    expect(bounds).toEqual([-77.12, 38.79, -76.91, 38.99]);
  });

  it("resolves Alaska at-large (district 0) via 00 key", async () => {
    const bounds = await getDistrictBounds("AK", "0");
    expect(bounds).toEqual([-179.15, 51.21, -129.98, 71.39]);
  });

  it("returns null for unknown district", async () => {
    const bounds = await getDistrictBounds("CA", "99");
    expect(bounds).toBeNull();
  });

  it("returns null for unknown state", async () => {
    const bounds = await getDistrictBounds("XX", "1");
    expect(bounds).toBeNull();
  });

  it("returns null when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const bounds = await getDistrictBounds("CA", "37");
    expect(bounds).toBeNull();
  });

  it("caches bounds data across calls", async () => {
    await getDistrictBounds("CA", "37");
    await getDistrictBounds("TX", "1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
