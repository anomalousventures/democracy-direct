import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Manifest } from "./optimize-photos";

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    mkdtemp: vi.fn(),
    rm: vi.fn(),
  },
}));

vi.mock("sharp", () => {
  const sharpInstance = {
    resize: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    avif: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined),
  };
  return { default: vi.fn(() => sharpInstance) };
});

import fs from "node:fs/promises";
import sharp from "sharp";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadManifest", () => {
  it("returns parsed manifest when file exists", async () => {
    const { loadManifest } = await import("./optimize-photos");
    const mockManifest: Manifest = {
      S000033: { hash: "abc123", lastUpdated: "2025-01-01T00:00:00.000Z" },
    };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockManifest));

    const result = await loadManifest();
    expect(result).toEqual(mockManifest);
  });

  it("returns empty object when file does not exist", async () => {
    const { loadManifest } = await import("./optimize-photos");
    vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

    const result = await loadManifest();
    expect(result).toEqual({});
  });
});

describe("saveManifest", () => {
  it("writes manifest JSON to disk", async () => {
    const { saveManifest } = await import("./optimize-photos");
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const manifest: Manifest = {
      A000123: { hash: "def456", lastUpdated: "2025-06-01T00:00:00.000Z" },
    };
    await saveManifest(manifest);

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("manifest.json"),
      expect.stringContaining('"A000123"')
    );
  });
});

describe("downloadPhoto", () => {
  it("returns null for 404 responses", async () => {
    const { downloadPhoto } = await import("./optimize-photos");
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await downloadPhoto("X999999", "/tmp/test");
    expect(result).toBeNull();
  });

  it("downloads and saves photo for valid response", async () => {
    const { downloadPhoto } = await import("./optimize-photos");
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const fakeImageBuffer = new ArrayBuffer(100);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(fakeImageBuffer),
    });

    const result = await downloadPhoto("S000033", "/tmp/test");
    expect(result).not.toBeNull();
    expect(result!.path).toContain("S000033.jpg");
    expect(result!.hash).toBeDefined();
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("throws for non-404 errors", async () => {
    const { downloadPhoto } = await import("./optimize-photos");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(downloadPhoto("S000033", "/tmp/test")).rejects.toThrow("HTTP 500");
  });
});

describe("processPhoto", () => {
  it("generates all 7 output variants", async () => {
    const { processPhoto } = await import("./optimize-photos");
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.alloc(100));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);

    const sharpInstance = vi.mocked(sharp)();

    await processPhoto("/tmp/source.jpg", "S000033", "/output");

    expect(sharpInstance.resize).toHaveBeenCalledTimes(3);
    expect(sharpInstance.resize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 256, height: 320, fit: "cover", position: "top" })
    );
    expect(sharpInstance.resize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 384, height: 480, fit: "cover", position: "top" })
    );
    expect(sharpInstance.resize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 450, height: 550, fit: "cover", position: "top" })
    );

    // sm: avif + webp + jpg, lg: avif + webp + jpg, og: jpg = 7 files
    expect(sharpInstance.toFile).toHaveBeenCalledTimes(7);
  });

  it("uses top-anchored crop for face framing", async () => {
    const { processPhoto } = await import("./optimize-photos");
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.alloc(100));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);

    const sharpInstance = vi.mocked(sharp)();

    await processPhoto("/tmp/source.jpg", "T000001", "/output");

    const resizeCalls = vi.mocked(sharpInstance.resize).mock.calls;
    for (const call of resizeCalls) {
      expect(call[0]).toMatchObject({ position: "top" });
    }
  });
});
