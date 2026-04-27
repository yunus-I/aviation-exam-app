import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, hash: string) {
  const [salt, storedKey] = hash.split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (derivedKey.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedBuffer);
}
