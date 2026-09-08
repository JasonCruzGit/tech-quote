import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAuthCredentials,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server/auth";
import { createUser, findUserByUsername } from "@/lib/server/authUsers";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    username?: string;
    password?: string;
    remember?: boolean;
  };

  const name = body.name?.trim() ?? "";
  const username = body.username?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const remember = body.remember !== false;

  if (name.length < 2) {
    return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–32 characters (letters, numbers, . _ -).",
      },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const admin = getAuthCredentials();
  if (username === admin.username.toLowerCase()) {
    return NextResponse.json(
      { error: "That username is reserved. Choose another." },
      { status: 409 }
    );
  }

  if (findUserByUsername(username)) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 }
    );
  }

  try {
    const user = createUser({ username, name, password });
    const days = remember ? 30 : 1;
    const token = await createSessionToken(
      { username: user.username, name: user.name },
      days
    );

    const res = NextResponse.json({
      user: { username: user.username, name: user.name },
    });
    res.cookies.set(
      SESSION_COOKIE,
      token,
      sessionCookieOptions(days * 24 * 60 * 60)
    );
    return res;
  } catch {
    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}
