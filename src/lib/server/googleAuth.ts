import { SESSION_DAYS } from "@/lib/server/auth";

export const GOOGLE_STATE_COOKIE = "tq_google_oauth";

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function getGoogleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured");
  }
  return { clientId, clientSecret };
}

/** Comma-separated emails and/or domains that may sign in with Google. */
export function isGoogleEmailAllowed(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return false;

  const allowList = (process.env.AUTH_GOOGLE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowList.length > 0) {
    return allowList.includes(normalized);
  }

  const domain =
    process.env.AUTH_GOOGLE_ALLOWED_DOMAIN?.trim().toLowerCase() || "techcentrix.com.mx";
  return normalized.endsWith(`@${domain}`);
}

export function googleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function appOrigin(request: Request): string {
  const envUrl = process.env.AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function oauthCookieOptions(maxAgeSeconds = 600) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export { SESSION_DAYS };
