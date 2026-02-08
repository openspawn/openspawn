import { Injectable } from "@nestjs/common";
import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

export interface TotpSetupResult {
  secret: string;
  qrCodeDataUrl: string;
  recoveryCodes: string[];
}

@Injectable()
export class TotpService {
  private readonly ISSUER = "OpenSpawn";
  private readonly RECOVERY_CODE_COUNT = 10;

  generateSecret(): string {
    // Generate a 20-byte secret and encode as base32
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
  }

  verifyToken(secret: string, token: string): boolean {
    const totp = new OTPAuth.TOTP({
      issuer: this.ISSUER,
      label: "OpenSpawn",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // Allow 1 period tolerance (±30 seconds)
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  }

  async generateSetup(email: string): Promise<TotpSetupResult> {
    const secret = this.generateSecret();

    // Create TOTP instance for URI generation
    const totp = new OTPAuth.TOTP({
      issuer: this.ISSUER,
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // Generate QR code
    const otpAuthUrl = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes();

    return {
      secret,
      qrCodeDataUrl,
      recoveryCodes,
    };
  }

  generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.RECOVERY_CODE_COUNT; i++) {
      // Generate 8-char alphanumeric codes
      const code = randomBytes(4).toString("hex").toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
  }

  validateRecoveryCode(code: string, validCodes: string[]): boolean {
    const normalizedCode = code.toUpperCase().replace(/-/g, "");
    return validCodes.some((valid) => {
      const normalizedValid = valid.toUpperCase().replace(/-/g, "");
      return normalizedCode === normalizedValid;
    });
  }

  removeRecoveryCode(code: string, validCodes: string[]): string[] {
    const normalizedCode = code.toUpperCase().replace(/-/g, "");
    return validCodes.filter((valid) => {
      const normalizedValid = valid.toUpperCase().replace(/-/g, "");
      return normalizedCode !== normalizedValid;
    });
  }

  // Encryption helpers
  encryptSecret(secret: string, encryptionKey: string): Buffer {
    const iv = randomBytes(12);
    const key = Buffer.from(encryptionKey, "hex");
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: iv (12) + authTag (16) + encrypted
    return Buffer.concat([iv, authTag, encrypted]);
  }

  decryptSecret(encryptedBuffer: Buffer, encryptionKey: string): string {
    const iv = encryptedBuffer.subarray(0, 12);
    const authTag = encryptedBuffer.subarray(12, 28);
    const encrypted = encryptedBuffer.subarray(28);

    const key = Buffer.from(encryptionKey, "hex");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  }

  encryptRecoveryCodes(codes: string[], encryptionKey: string): Buffer {
    return this.encryptSecret(JSON.stringify(codes), encryptionKey);
  }

  decryptRecoveryCodes(encryptedBuffer: Buffer, encryptionKey: string): string[] {
    const json = this.decryptSecret(encryptedBuffer, encryptionKey);
    return JSON.parse(json);
  }
}
