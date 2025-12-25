import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT = "mcp-server-encryption";

let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (!cachedKey) {
    cachedKey = scryptSync(env.AUTH_SECRET, SALT, 32);
  }
  return cachedKey;
}

export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return "";
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    return "";
  }

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted format");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function encryptNullable(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return encrypt(value);
}

export function decryptNullable(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    return decrypt(value);
  } catch {
    return null;
  }
}
