import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRequiredEnv } from "@/lib/env";
import { jsonResponse, badRequest, notFound, serverError } from "@/lib/api-response";
import { requireAdmin, ADMIN_TRUST_LEVEL } from "@/lib/admin";
import { parseJsonBody } from "@/lib/request-body";
import { z } from "zod";
import { TRUST_LEVELS } from "@/lib/trust-level";

export const prerender = false;

const updateUserSchema = z.object({
  trustLevel: z.number().int().min(TRUST_LEVELS.BANNED).max(TRUST_LEVELS.ADMIN),
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  const adminError = requireAdmin(user);
  if (adminError) return adminError;

  const { userId } = params;
  if (!userId) {
    return badRequest("User ID is required");
  }

  const parseResult = await parseJsonBody(request, updateUserSchema);
  if (!parseResult.success) {
    return badRequest(parseResult.error);
  }

  const { trustLevel } = parseResult.data;

  if (userId === user!.id && trustLevel < ADMIN_TRUST_LEVEL) {
    return badRequest("Cannot demote yourself");
  }

  try {
    const db = createDb(getRequiredEnv(locals, "DATABASE_URL"));

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return notFound("User not found");
    }

    await db.update(users).set({ trustLevel }).where(eq(users.id, userId));

    return jsonResponse({
      success: true,
      userId,
      trustLevel,
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return serverError("Failed to update user");
  }
};
