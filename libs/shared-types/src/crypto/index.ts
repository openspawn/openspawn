import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Generate a random 32-byte signing secret as a hex string.
 */
export function generateSigningSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Compute HMAC-SHA256 signature.
 */
export function computeSignature(secret: string, message: string): string {
  const { createHmac } = require("node:crypto");
  return createHmac("sha256", Buffer.from(secret, "hex")).update(message).digest("hex");
}

/**
 * Encrypt a plaintext secret using AES-256-GCM.
 * Returns a Buffer containing: IV (12 bytes) + authTag (16 bytes) + ciphertext
 */
export function encryptSecret(plaintext: string, encryptionKey: string): Buffer {
  const key = Buffer.from(encryptionKey, "hex");
  if (key.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: IV (12) + authTag (16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt an encrypted secret using AES-256-GCM.
 * Expects a Buffer containing: IV (12 bytes) + authTag (16 bytes) + ciphertext
 */
export function decryptSecret(encrypted: Buffer, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "hex");
  if (key.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const iv = encrypted.subarray(0, 12);
  const authTag = encrypted.subarray(12, 28);
  const ciphertext = encrypted.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * Constant-time comparison for signatures (prevents timing attacks).
 */
export function secureCompare(a: string, b: string): boolean {
  const { timingSafeEqual } = require("node:crypto");
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
