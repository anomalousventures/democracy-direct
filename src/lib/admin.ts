import { unauthorized, forbidden } from "./api-response";
import { TRUST_LEVELS, isAdmin } from "./trust-level";

export { isAdmin };

export const ADMIN_TRUST_LEVEL = TRUST_LEVELS.ADMIN;

type UserWithIdAndTrustLevel = { id: string; trustLevel: number } | null | undefined;

export function requireAdmin(user: UserWithIdAndTrustLevel): Response | null {
  if (!user) {
    return unauthorized();
  }

  if (!isAdmin(user)) {
    return forbidden("Admin access required");
  }

  return null;
}
