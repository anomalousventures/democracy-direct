import { randomInt } from "crypto";
import { sha256 } from "./hash-email";

export function hashOTP(otp: string): string {
  return sha256(otp);
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
