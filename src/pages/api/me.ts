export const prerender = false;

import type { APIRoute } from "astro";
import { jsonResponse } from "@/lib/api-response";
import type { SessionUser } from "@/middleware";

export interface MeResponse {
  id: string;
  emailHash: string;
  savedState: string | null;
  savedDistrict: string | null;
  isAdmin: boolean;
}

export type MeApiResponse = MeResponse | null;

function isAdmin(user: SessionUser): boolean {
  const ADMIN_TRUST_LEVEL = 100;
  return user.trustLevel >= ADMIN_TRUST_LEVEL;
}

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return jsonResponse(null);
  }

  const response: MeResponse = {
    id: user.id,
    emailHash: user.emailHash,
    savedState: user.savedState,
    savedDistrict: user.savedDistrict,
    isAdmin: isAdmin(user),
  };

  return jsonResponse(response);
};
