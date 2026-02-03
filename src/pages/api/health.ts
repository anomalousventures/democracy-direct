import type { APIRoute } from "astro";
import { sql } from "drizzle-orm";
import { createDb } from "@/db/client";
import { getConfigSafe } from "@/lib/config";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const configResult = getConfigSafe(locals);

  if (!configResult.success) {
    return new Response(
      JSON.stringify({
        status: "degraded",
        db: "config_error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let dbConnected = false;
  try {
    const db = createDb(configResult.config.database.url);
    await db.execute(sql`SELECT 1`);
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  const status = dbConnected ? "ok" : "degraded";
  const statusCode = dbConnected ? 200 : 503;

  return new Response(
    JSON.stringify({
      status,
      db: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    }
  );
};
