import { createHash, randomInt } from "crypto";

export function hashOTP(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export function generateOTP(): { otp: string; otpHash: string } {
  const otp = randomInt(0, 1000000).toString().padStart(6, "0");
  const otpHash = hashOTP(otp);
  return { otp, otpHash };
}

export function verifyOTP(otp: string, storedHash: string): boolean {
  const inputHash = hashOTP(otp);
  return inputHash === storedHash;
}
