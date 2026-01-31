import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { createDb } from "@/db/client";
import { users } from "@/db/schema";
import { getConfig } from "@/lib/config";
import { badRequest, unauthorized, jsonResponse, serverError } from "@/lib/api-response";
import { isValidState } from "@/lib/states";

export const prerender = false;

const DISTRICT_PATTERN = /^(\d{1,2}|AL)$/;

function isValidDistrict(district: string): boolean {
  return DISTRICT_PATTERN.test(district);
}

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) {
    return badRequest("Request body must be an object");
  }

  const { state, district } = body as { state?: unknown; district?: unknown };

  if (typeof state !== "string" || typeof district !== "string") {
    return badRequest("state and district are required strings");
  }

  const upperState = state.toUpperCase();
  const upperDistrict = district.toUpperCase();

  if (!isValidState(upperState)) {
    return badRequest("Invalid state code");
  }

  if (!isValidDistrict(upperDistrict)) {
    return badRequest("Invalid district (must be 1-2 digits or AL for at-large)");
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    await db
      .update(users)
      .set({
        savedState: upperState,
        savedDistrict: upperDistrict,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return jsonResponse({
      success: true,
      savedState: upperState,
      savedDistrict: upperDistrict,
    });
  } catch (error) {
    console.error("Failed to save district:", error);
    return serverError("Failed to save district");
  }
};

export const DELETE: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    await db
      .update(users)
      .set({
        savedState: null,
        savedDistrict: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to clear district:", error);
    return serverError("Failed to clear district");
  }
};
