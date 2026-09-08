import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAuthCredentials,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server/auth";

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

  if (username !== creds.username || password !== creds.password) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const days = remember ? 30 : 1;
  const token = await createSessionToken(
    {
      username: creds.username,
      name: creds.name,
    },
    days
  );

  const res = NextResponse.json({
    user: { username: creds.username, name: creds.name },
  });
  res.cookies.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(days * 24 * 60 * 60)
  );
  return res;
}
