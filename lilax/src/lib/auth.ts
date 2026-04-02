import crypto from "crypto";

export const SESSION_COOKIE_NAME = "lilax_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) {
    return false;
  }

  const derived = crypto.scryptSync(password, salt, KEY_LENGTH);
  const hashBuffer = Buffer.from(hash, "hex");
  if (hashBuffer.length !== derived.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, derived);
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">) {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", getAuthSecret())
    .update(body)
    .digest("base64url");

  const valid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  if (!valid) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
