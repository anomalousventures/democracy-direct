import { createHash } from "crypto";

export function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return createHash("sha256").update(normalized).digest("hex");
}
