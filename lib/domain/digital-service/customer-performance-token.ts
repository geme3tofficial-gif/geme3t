import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getEncryptionKey() {
  const key = process.env.CUSTOMER_SHARE_LINK_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error(
      "CUSTOMER_SHARE_LINK_ENCRYPTION_KEY must be configured as 64 hexadecimal characters.",
    );
  }
  return Buffer.from(key, "hex");
}

export function createCustomerPerformanceToken() {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    shareTokenHash: createHash("sha256").update(token).digest("hex"),
    shareTokenEncrypted: encryptCustomerPerformanceToken(token),
  };
}

export function encryptCustomerPerformanceToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptCustomerPerformanceToken(value: string) {
  const [encodedIv, encodedTag, encodedData, ...rest] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedData || rest.length > 0) {
    throw new Error("Stored customer tracking link is invalid.");
  }

  const key = getEncryptionKey();
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    const token = Buffer.concat([
      decipher.update(Buffer.from(encodedData, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new Error("Stored customer tracking token is invalid.");
    }
    return token;
  } catch {
    throw new Error(
      "Could not decrypt a customer tracking link. Verify CUSTOMER_SHARE_LINK_ENCRYPTION_KEY has not changed.",
    );
  }
}
