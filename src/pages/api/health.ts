import type { APIRoute } from "astro";
import { checkDbConnection } from "../../lib/db";

export const prerender = false;

export const GET: APIRoute = async () => {
  const dbConnected = await checkDbConnection();

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
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
