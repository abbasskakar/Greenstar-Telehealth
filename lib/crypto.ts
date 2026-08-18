import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

// SERVER-ONLY. Encrypts CNIC at rest with AES-256-GCM; the hash enables
// uniqueness/lookup without decryption; last-4 enables masked display.

function key() {
  const hex = process.env.CNIC_ENCRYPTION_KEY ?? "";
  return Buffer.from(hex, "hex");
}

export function encryptCnic(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptCnic(payload: string): string | null {
  try {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function hashCnic(cnic: string): string {
  return createHash("sha256").update(cnic).digest("hex");
}

/** Masked display, e.g. •••••-•••••••-3 */
export function maskCnicLast4(last4: string): string {
  const l = last4.slice(-4);
  return `•••••-•••${l.slice(0, 3)}-${l.slice(3) || "•"}`;
}
