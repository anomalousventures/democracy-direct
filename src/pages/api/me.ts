export const prerender = false;

import type { APIRoute } from "astro";
import { isAdmin } from "@/lib/admin";
import { jsonResponse } from "@/lib/api-response";

export interface MeResponse {
  id: string;
  emailHash: string;
  savedState: string | null;
  savedDistrict: string | null;
  isAdmin: boolean;
}

export type MeApiResponse = MeResponse | null;

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
