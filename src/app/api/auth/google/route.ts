import { NextResponse } from "next/server";
import {
  appOrigin,
  getGoogleClientConfig,
  GOOGLE_STATE_COOKIE,
  googleAuthUrl,
  isGoogleAuthConfigured,
  oauthCookieOptions,
} from "@/lib/server/googleAuth";

function randomState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    const login = new URL("/login", appOrigin(request));
    login.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(login);
  }

  const { clientId } = getGoogleClientConfig();
  const origin = appOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const next = new URL(request.url).searchParams.get("next") || "/";
  const state = randomState();

  const payload = JSON.stringify({
    s: state,
    n: next.startsWith("/") ? next : "/",
  });

  const res = NextResponse.redirect(
    googleAuthUrl({ clientId, redirectUri, state })
  );
  res.cookies.set(GOOGLE_STATE_COOKIE, payload, oauthCookieOptions());
  return res;
}
