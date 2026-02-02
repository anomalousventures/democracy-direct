export const TRUST_LEVELS = {
  BANNED: -1,
  NEW_USER: 0,
  TRUSTED: 1,
  ADMIN: 2,
} as const;

export type TrustLevel = (typeof TRUST_LEVELS)[keyof typeof TRUST_LEVELS];

export const APPROVED_TEMPLATES_FOR_TRUST = 2;

export function calculateTrustLevel(
  currentTrustLevel: number,
  approvedTemplatesCount: number,
  isAdmin: boolean = false
): number {
  if (isAdmin) {
    return TRUST_LEVELS.ADMIN;
  }

  if (currentTrustLevel === TRUST_LEVELS.BANNED) {
    return TRUST_LEVELS.BANNED;
  }

  if (approvedTemplatesCount >= APPROVED_TEMPLATES_FOR_TRUST) {
    return Math.max(currentTrustLevel, TRUST_LEVELS.TRUSTED);
  }

  return Math.max(currentTrustLevel, TRUST_LEVELS.NEW_USER);
}

export function getTrustLevelLabel(trustLevel: number): string {
  switch (trustLevel) {
    case TRUST_LEVELS.BANNED:
      return "Banned";
    case TRUST_LEVELS.NEW_USER:
      return "New User";
    case TRUST_LEVELS.TRUSTED:
      return "Trusted";
    case TRUST_LEVELS.ADMIN:
      return "Admin";
    default:
      return "Unknown";
  }
}

export function canCreateTemplates(trustLevel: number): boolean {
  return trustLevel >= TRUST_LEVELS.NEW_USER;
}

type UserWithTrustLevel = { trustLevel: number } | null | undefined;

export function hasMinTrustLevel(user: UserWithTrustLevel, minLevel: TrustLevel): boolean {
  if (!user) return false;
  return user.trustLevel >= minLevel;
}

export function isTrusted(user: UserWithTrustLevel): boolean {
  return hasMinTrustLevel(user, TRUST_LEVELS.TRUSTED);
}

export function isAdmin(user: UserWithTrustLevel): boolean {
  return hasMinTrustLevel(user, TRUST_LEVELS.ADMIN);
}

export function isBanned(user: UserWithTrustLevel): boolean {
  if (!user) return false;
  return user.trustLevel === TRUST_LEVELS.BANNED;
}
