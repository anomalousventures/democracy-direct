const SALT = "dd-storage";
const ITERATIONS = 100000;

async function deriveKey(emailHash: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(emailHash),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

interface EncryptedPayload {
  iv: string;
  ct: string;
}

export async function encrypt(data: string, emailHash: string): Promise<string> {
  const key = await deriveKey(emailHash);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data)
  );

  const payload: EncryptedPayload = {
    iv: btoa(String.fromCharCode(...iv)),
    ct: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };

  return JSON.stringify(payload);
}

export async function decrypt(encryptedData: string, emailHash: string): Promise<string> {
  const key = await deriveKey(emailHash);
  const payload = JSON.parse(encryptedData) as EncryptedPayload;

  const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(payload.ct), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

  return new TextDecoder().decode(decrypted);
}

export function isEncryptedPayload(data: string): boolean {
  try {
    const parsed = JSON.parse(data) as unknown;
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "iv" in parsed &&
      "ct" in parsed &&
      typeof (parsed as EncryptedPayload).iv === "string" &&
      typeof (parsed as EncryptedPayload).ct === "string"
    );
  } catch {
    return false;
  }
}
