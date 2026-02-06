import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  computeSignature,
  decryptSecret,
  encryptSecret,
  generateSigningSecret,
  secureCompare,
} from "./index";

describe("Crypto utilities", () => {
  const testEncryptionKey = randomBytes(32).toString("hex");

  describe("generateSigningSecret", () => {
    it("should generate a 64-character hex string (32 bytes)", () => {
      const secret = generateSigningSecret();
      expect(secret).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(secret)).toBe(true);
    });

    it("should generate unique secrets", () => {
      const secret1 = generateSigningSecret();
      const secret2 = generateSigningSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe("computeSignature", () => {
    it("should compute consistent HMAC-SHA256 signatures", () => {
      const secret = generateSigningSecret();
      const message = "test message";

      const sig1 = computeSignature(secret, message);
      const sig2 = computeSignature(secret, message);

      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64); // SHA256 = 32 bytes = 64 hex chars
    });

    it("should produce different signatures for different messages", () => {
      const secret = generateSigningSecret();

      const sig1 = computeSignature(secret, "message 1");
      const sig2 = computeSignature(secret, "message 2");

      expect(sig1).not.toBe(sig2);
    });
  });

  describe("encryptSecret / decryptSecret", () => {
    it("should encrypt and decrypt correctly", () => {
      const plaintext = "my-secret-value";

      const encrypted = encryptSecret(plaintext, testEncryptionKey);
      const decrypted = decryptSecret(encrypted, testEncryptionKey);

      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext each time (random IV)", () => {
      const plaintext = "same-secret";

      const encrypted1 = encryptSecret(plaintext, testEncryptionKey);
      const encrypted2 = encryptSecret(plaintext, testEncryptionKey);

      expect(encrypted1.equals(encrypted2)).toBe(false);
    });

    it("should fail decryption with wrong key", () => {
      const plaintext = "secret";
      const wrongKey = randomBytes(32).toString("hex");

      const encrypted = encryptSecret(plaintext, testEncryptionKey);

      expect(() => decryptSecret(encrypted, wrongKey)).toThrow();
    });

    it("should reject invalid key length", () => {
      expect(() => encryptSecret("test", "short-key")).toThrow("32 bytes");
      expect(() => decryptSecret(Buffer.alloc(50), "short-key")).toThrow("32 bytes");
    });
  });

  describe("secureCompare", () => {
    it("should return true for equal strings", () => {
      expect(secureCompare("abc123", "abc123")).toBe(true);
    });

    it("should return false for different strings", () => {
      expect(secureCompare("abc123", "abc124")).toBe(false);
    });

    it("should return false for different length strings", () => {
      expect(secureCompare("short", "longer-string")).toBe(false);
    });
  });
});
