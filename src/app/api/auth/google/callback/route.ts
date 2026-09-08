import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server/auth";
import {
  appOrigin,
  getGoogleClientConfig,
  GOOGLE_STATE_COOKIE,
  isGoogleEmailAllowed,
  oauthCookieOptions,
  SESSION_DAYS,
} from "@/lib/server/googleAuth";

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface UserInfo {
  email?: string;
  email_verified?: boolean;
  name?: string;
}

function loginErrorRedirect(origin: string, code: string) {
  const login = new URL("/login", origin);
  login.searchParams.set("error", code);
  const res = NextResponse.redirect(login);
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { ...oauthCookieOptions(0), maxAge: 0 });
  return res;
}

export async function GET(request: Request) {
  const origin = appOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) return loginErrorRedirect(origin, "google_denied");
  if (!code || !state) return loginErrorRedirect(origin, "google_invalid");

  const jar = await cookies();
  const raw = jar.get(GOOGLE_STATE_COOKIE)?.value ?? "";
  let nextPath = "/";
  try {
    const parsed = JSON.parse(raw) as { s?: string; n?: string };
    if (!parsed.s || parsed.s !== state) {
      return loginErrorRedirect(origin, "google_state");
    }
    if (parsed.n?.startsWith("/")) nextPath = parsed.n;
  } catch {
    return loginErrorRedirect(origin, "google_state");
  }

  let clientId: string;
  let clientSecret: string;
  try {
    ({ clientId, clientSecret } = getGoogleClientConfig());
  } catch {
    return loginErrorRedirect(origin, "google_not_configured");
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenRes.json()) as TokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    return loginErrorRedirect(origin, "google_token");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json()) as UserInfo;
  const email = profile.email?.trim().toLowerCase() ?? "";

  if (!email || profile.email_verified === false) {
    return loginErrorRedirect(origin, "google_email");
  }
  if (!isGoogleEmailAllowed(email)) {
    return loginErrorRedirect(origin, "google_forbidden");
  }

  const displayName = profile.name?.trim() || email.split("@")[0] || "Google User";
  const token = await createSessionToken(
    { username: email, name: displayName },
    SESSION_DAYS
  );

  const res = NextResponse.redirect(new URL(nextPath, origin));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(SESSION_DAYS * 24 * 60 * 60));
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { ...oauthCookieOptions(0), maxAge: 0 });
  return res;
}
