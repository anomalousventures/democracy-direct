import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, HEAD, parseRange } from "@/pages/api/tiles/[...path]";

function mockR2Object(size: number, body: ReadableStream | null = new ReadableStream()) {
  return { size, body, range: undefined };
}

function mockBucket(objects: Record<string, { size: number }> = {}) {
  return {
    head: vi.fn((key: string) => {
      const obj = objects[key];
      return obj ? { size: obj.size } : null;
    }),
    get: vi.fn((key: string) => {
      const obj = objects[key];
      return obj ? mockR2Object(obj.size) : null;
    }),
  };
}

function makeContext(
  method: string,
  path: string | undefined,
  bucket: ReturnType<typeof mockBucket> | undefined,
  headers: Record<string, string> = {}
) {
  const url = new URL(`http://test/api/tiles/${path ?? ""}`);
  return {
    params: { path },
    request: new Request(url, { method, headers }),
    locals: {
      runtime: { env: { TILES_BUCKET: bucket } },
    },
  } as never;
}

describe("parseRange", () => {
  it("parses a valid range", () => {
    expect(parseRange("bytes=0-16383", 1000000)).toEqual({ offset: 0, length: 16384 });
  });

  it("parses range with open end", () => {
    expect(parseRange("bytes=100-", 500)).toEqual({ offset: 100, length: 400 });
  });

  it("returns null for invalid format", () => {
    expect(parseRange("invalid", 100)).toBeNull();
  });

  it("returns null when start exceeds file size", () => {
    expect(parseRange("bytes=200-300", 100)).toBeNull();
  });

  it("returns null when end exceeds file size", () => {
    expect(parseRange("bytes=0-200", 100)).toBeNull();
  });

  it("returns null when start > end", () => {
    expect(parseRange("bytes=50-10", 100)).toBeNull();
  });
});

describe("GET /api/tiles/[...path]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 503 when TILES_BUCKET is missing", async () => {
    const ctx = makeContext("GET", "districts.pmtiles", undefined);
    const res = await GET(ctx);
    expect(res.status).toBe(503);
  });

  it("returns 404 when path is empty", async () => {
    const bucket = mockBucket();
    const ctx = makeContext("GET", undefined, bucket);
    const res = await GET(ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-.pmtiles paths", async () => {
    const bucket = mockBucket({ "secret.json": { size: 100 } });
    const ctx = makeContext("GET", "secret.json", bucket);
    const res = await GET(ctx);
    expect(res.status).toBe(404);
    expect(bucket.head).not.toHaveBeenCalled();
  });

  it("returns 404 when object does not exist", async () => {
    const bucket = mockBucket();
    const ctx = makeContext("GET", "missing.pmtiles", bucket);
    const res = await GET(ctx);
    expect(res.status).toBe(404);
  });

  it("returns full object for non-range GET", async () => {
    const bucket = mockBucket({ "districts.pmtiles": { size: 50000 } });
    const ctx = makeContext("GET", "districts.pmtiles", bucket);
    const res = await GET(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Length")).toBe("50000");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Vary")).toBe("Range");
    expect(res.headers.get("Cache-Control")).toContain("public");
  });

  it("returns 206 with correct headers for range request", async () => {
    const bucket = mockBucket({ "districts.pmtiles": { size: 100000 } });
    const ctx = makeContext("GET", "districts.pmtiles", bucket, {
      Range: "bytes=0-16383",
    });
    const res = await GET(ctx);

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Length")).toBe("16384");
    expect(res.headers.get("Content-Range")).toBe("bytes 0-16383/100000");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Vary")).toBe("Range");
  });

  it("returns 416 for unsatisfiable range", async () => {
    const bucket = mockBucket({ "districts.pmtiles": { size: 1000 } });
    const ctx = makeContext("GET", "districts.pmtiles", bucket, {
      Range: "bytes=2000-3000",
    });
    const res = await GET(ctx);

    expect(res.status).toBe(416);
    expect(res.headers.get("Content-Range")).toBe("bytes */1000");
  });
});

describe("HEAD /api/tiles/[...path]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns size and Accept-Ranges for existing object", async () => {
    const bucket = mockBucket({ "districts.pmtiles": { size: 75000 } });
    const ctx = makeContext("HEAD", "districts.pmtiles", bucket);
    const res = await HEAD(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Length")).toBe("75000");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Vary")).toBe("Range");
  });

  it("returns 404 for missing object", async () => {
    const bucket = mockBucket();
    const ctx = makeContext("HEAD", "missing.pmtiles", bucket);
    const res = await HEAD(ctx);
    expect(res.status).toBe(404);
  });
});
