import type { APIRoute } from "astro";
import { notFound } from "@/lib/api-response";

export const prerender = false;

export function parseRange(
  header: string,
  fileSize: number
): { offset: number; length: number } | null {
  const match = header.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) return null;

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end) return null;
  return { offset: start, length: end - start + 1 };
}

const CACHE_HEADER = "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=604800";

const handler: APIRoute = async ({ params, request, locals }) => {
  const bucket = locals.runtime?.env?.TILES_BUCKET;
  if (!bucket) {
    return new Response("Tile storage not configured", { status: 503 });
  }

  const key = params.path;
  if (!key || !key.endsWith(".pmtiles")) return notFound();

  const rangeHeader = request.headers.get("range");

  if (request.method === "HEAD") {
    const head = await bucket.head(key);
    if (!head) return notFound();

    return new Response(null, {
      status: 200,
      headers: {
        "Content-Length": String(head.size),
        "Accept-Ranges": "bytes",
        Vary: "Range",
        "Content-Type": "application/octet-stream",
        "Cache-Control": CACHE_HEADER,
      },
    });
  }

  if (rangeHeader) {
    const head = await bucket.head(key);
    if (!head) return notFound();

    const range = parseRange(rangeHeader, head.size);
    if (!range) {
      return new Response("Range not satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${head.size}` },
      });
    }

    const object = await bucket.get(key, { range });
    if (!object) return notFound();

    return new Response(object.body, {
      status: 206,
      headers: {
        "Content-Length": String(range.length),
        "Content-Range": `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`,
        "Accept-Ranges": "bytes",
        Vary: "Range",
        "Content-Type": "application/octet-stream",
        "Cache-Control": CACHE_HEADER,
      },
    });
  }

  const object = await bucket.get(key);
  if (!object) return notFound();

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Length": String(object.size),
      "Accept-Ranges": "bytes",
      Vary: "Range",
      "Content-Type": "application/octet-stream",
      "Cache-Control": CACHE_HEADER,
    },
  });
};

export const GET = handler;
export const HEAD = handler;
