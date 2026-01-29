import { createHash } from "crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return sha256(normalized);
}
