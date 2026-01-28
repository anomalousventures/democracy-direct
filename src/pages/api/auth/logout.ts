import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { createDb } from "../../../db/client";
import { sessions } from "../../../db/schema";

export const POST: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get("session")?.value;

  if (sessionId) {
    try {
      const db = createDb(import.meta.env.DATABASE_URL);
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  cookies.delete("session", { path: "/" });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
