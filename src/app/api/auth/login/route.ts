import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAuthCredentials,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server/auth";
import { findUserByUsername, verifyPassword } from "@/lib/server/authUsers";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
    remember?: boolean;
  };

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  const remember = Boolean(body.remember);
  const creds = getAuthCredentials();

  let sessionUser: { username: string; name: string } | null = null;

  if (username === creds.username && password === creds.password) {
    sessionUser = { username: creds.username, name: creds.name };
  } else {
    const dbUser = findUserByUsername(username);
    if (dbUser && verifyPassword(password, dbUser.passwordHash)) {
      sessionUser = { username: dbUser.username, name: dbUser.name };
    }
  }

  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const days = remember ? 30 : 1;
  const token = await createSessionToken(sessionUser, days);

  const res = NextResponse.json({ user: sessionUser });
  res.cookies.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(days * 24 * 60 * 60)
  );
  return res;
}
