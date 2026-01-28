import { unauthorized, forbidden } from "./api-response";
import { TRUST_LEVELS } from "./trust-level";

export const ADMIN_TRUST_LEVEL = TRUST_LEVELS.ADMIN;

type UserWithTrustLevel = { trustLevel: number } | null | undefined;
type UserWithIdAndTrustLevel = { id: string; trustLevel: number } | null | undefined;

export function isAdmin(user: UserWithTrustLevel): boolean {
  if (!user) return false;
  return user.trustLevel >= ADMIN_TRUST_LEVEL;
}

export function requireAdmin(user: UserWithIdAndTrustLevel): Response | null {
  if (!user) {
    return unauthorized();
  }

  if (!isAdmin(user)) {
    return forbidden("Admin access required");
  }

  return null;
}
