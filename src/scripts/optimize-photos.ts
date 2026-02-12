import "dotenv/config";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const PHOTO_BASE_URL = "https://bioguide.congress.gov/bioguide/photo";
const PUBLIC_PHOTOS_DIR = path.resolve("public/photos");
const MANIFEST_PATH = path.join(PUBLIC_PHOTOS_DIR, "manifest.json");
const CONCURRENCY_LIMIT = 5;

interface ManifestEntry {
  hash: string;
  lastUpdated: string;
}

export type Manifest = Record<string, ManifestEntry>;

interface SizeConfig {
  width: number;
  height: number;
}

const SIZE_CONFIGS: Record<string, SizeConfig> = {
  sm: { width: 256, height: 320 },
  lg: { width: 384, height: 480 },
  og: { width: 450, height: 550 },
};

export interface OptimizeResult {
  downloaded: number;
  skipped: number;
  failed: string[];
  duration: string;
}

export async function loadManifest(): Promise<Manifest> {
  try {
    const data = await fs.readFile(MANIFEST_PATH, "utf-8");
    return JSON.parse(data) as Manifest;
  } catch {
    return {};
  }
}

export async function saveManifest(manifest: Manifest): Promise<void> {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function downloadPhoto(
  bioguideId: string,
  destDir: string
): Promise<{ path: string; hash: string } | null> {
  const firstChar = bioguideId[0].toUpperCase();
  const url = `${PHOTO_BASE_URL}/${firstChar}/${bioguideId}.jpg`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = hashBuffer(buffer);
  const filePath = path.join(destDir, `${bioguideId}.jpg`);
  await fs.writeFile(filePath, buffer);

  return { path: filePath, hash };
}

export async function processPhoto(
  sourcePath: string,
  bioguideId: string,
  outputBase: string
): Promise<void> {
  const original = await fs.readFile(sourcePath);

  const tasks: Promise<void>[] = [];

  for (const [sizeName, config] of Object.entries(SIZE_CONFIGS)) {
    const resized = sharp(original).resize({
      width: config.width,
      height: config.height,
      fit: "cover",
      position: "top",
    });

    if (sizeName === "og") {
      const ogDir = path.join(outputBase, "og");
      await fs.mkdir(ogDir, { recursive: true });
      tasks.push(
        resized
          .clone()
          .jpeg({ quality: 85 })
          .toFile(path.join(ogDir, `${bioguideId}.jpg`))
          .then(() => undefined)
      );
    } else {
      const avifDir = path.join(outputBase, sizeName, "avif");
      const webpDir = path.join(outputBase, sizeName, "webp");
      const jpgDir = path.join(outputBase, sizeName, "jpg");
      await fs.mkdir(avifDir, { recursive: true });
      await fs.mkdir(webpDir, { recursive: true });
      await fs.mkdir(jpgDir, { recursive: true });

      tasks.push(
        resized
          .clone()
          .avif({ quality: 50, effort: 6 })
          .toFile(path.join(avifDir, `${bioguideId}.avif`))
          .then(() => undefined)
      );
      tasks.push(
        resized
          .clone()
          .webp({ quality: 75 })
          .toFile(path.join(webpDir, `${bioguideId}.webp`))
          .then(() => undefined)
      );
      tasks.push(
        resized
          .clone()
          .jpeg({ quality: 80 })
          .toFile(path.join(jpgDir, `${bioguideId}.jpg`))
          .then(() => undefined)
      );
    }
  }

  await Promise.all(tasks);
}

async function fetchBioguideIds(): Promise<string[]> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required when manifest.json has no entries and --ids not provided"
    );
  }

  const { createDb } = await import("@/db/client");
  const { legislators } = await import("@/db/schema");

  const db = createDb(databaseUrl);
  const rows = await db.select({ bioguideId: legislators.bioguideId }).from(legislators);
  return rows.map((r) => r.bioguideId);
}

async function runConcurrent<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      await fn(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
}

export async function optimizePhotos(options: {
  force?: boolean;
  ids?: string[];
}): Promise<OptimizeResult> {
  const startTime = Date.now();
  const manifest = await loadManifest();

  let bioguideIds: string[];

  if (options.ids && options.ids.length > 0) {
    bioguideIds = options.ids;
  } else if (Object.keys(manifest).length > 0 && !options.force) {
    bioguideIds = Object.keys(manifest);
    console.log(`Using ${bioguideIds.length} IDs from manifest`);
    const dbIds = await fetchBioguideIds().catch(() => null);
    if (dbIds) {
      const manifestSet = new Set(bioguideIds);
      const newIds = dbIds.filter((id) => !manifestSet.has(id));
      if (newIds.length > 0) {
        console.log(`Found ${newIds.length} new IDs from database`);
        bioguideIds = [...bioguideIds, ...newIds];
      }
    }
  } else {
    bioguideIds = await fetchBioguideIds();
    console.log(`Loaded ${bioguideIds.length} bioguide IDs from database`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "photos-"));
  let downloaded = 0;
  let skipped = 0;
  const failed: string[] = [];

  try {
    await runConcurrent(bioguideIds, CONCURRENCY_LIMIT, async (bioguideId) => {
      try {
        const result = await downloadPhoto(bioguideId, tmpDir);

        if (!result) {
          skipped++;
          return;
        }

        if (!options.force && manifest[bioguideId]?.hash === result.hash) {
          skipped++;
          return;
        }

        await processPhoto(result.path, bioguideId, PUBLIC_PHOTOS_DIR);

        manifest[bioguideId] = {
          hash: result.hash,
          lastUpdated: new Date().toISOString(),
        };
        downloaded++;

        if (downloaded % 25 === 0) {
          console.log(`Processed ${downloaded} photos...`);
        }
      } catch (err) {
        console.error(`Failed to process ${bioguideId}:`, err);
        failed.push(bioguideId);
      }
    });

    await saveManifest(manifest);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1) + "s";
  return { downloaded, skipped, failed, duration };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes("--force");
  const idsFlag = process.argv.indexOf("--ids");
  const ids = idsFlag !== -1 ? process.argv[idsFlag + 1]?.split(",").filter(Boolean) : undefined;

  if (force) {
    console.log("Force mode: re-processing all photos");
  }

  optimizePhotos({ force, ids })
    .then((result) => {
      console.log(
        `\nDone in ${result.duration}: ${result.downloaded} downloaded, ${result.skipped} skipped, ${result.failed.length} failed`
      );
      if (result.failed.length > 0) {
        console.log("Failed IDs:", result.failed.join(", "));
      }
      console.log(JSON.stringify(result));
      process.exit(result.failed.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Optimization failed:", error);
      process.exit(1);
    });
}
