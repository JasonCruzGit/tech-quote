export const SESSION_COOKIE = "tq_session";
export const SESSION_DAYS = 7;

export interface SessionUser {
  username: string;
  name: string;
}

function authSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "techcentrix-dev-secret-change-me"
  );
}

export function getAuthCredentials(): { username: string; password: string; name: string } {
  return {
    username: process.env.AUTH_USERNAME?.trim() || "admin",
    password: process.env.AUTH_PASSWORD?.trim() || "techcentrix",
    name: process.env.AUTH_DISPLAY_NAME?.trim() || "Administrator",
  };
}

function b64urlFromBytes(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlFromString(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function stringFromB64url(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(normalized)));
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payloadB64: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  return b64urlFromBytes(sig);
}

export async function createSessionToken(
  user: SessionUser,
  days = SESSION_DAYS
): Promise<string> {
  const payload = {
    u: user.username,
    n: user.name,
    exp: Date.now() + days * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = b64urlFromString(JSON.stringify(payload));
  const signature = await sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = await sign(payloadB64);
  if (expected.length !== signature.length) return null;

  // Constant-ish time compare
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    const raw = JSON.parse(stringFromB64url(payloadB64)) as {
      u?: string;
      n?: string;
      exp?: number;
    };
    if (!raw.u || !raw.n || !raw.exp || Date.now() > raw.exp) return null;
    return { username: raw.u, name: raw.n };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
