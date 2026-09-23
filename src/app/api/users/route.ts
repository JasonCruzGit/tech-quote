import { NextResponse } from "next/server";
import { getAuthCredentials } from "@/lib/server/auth";
import {
  createUser,
  findUserByUsername,
  listUsers,
  normalizeRole,
  toPublicUser,
} from "@/lib/server/authUsers";
import { ensureDbReady } from "@/lib/server/db";
import type { PublicUser } from "@/lib/types";

function validateUsername(username: string): string | null {
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return "Username must be 3–32 characters (letters, numbers, . _ -).";
  }
  return null;
}

function validateEmail(email: string): string | null {
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export async function GET() {
  await ensureDbReady();
  const admin = getAuthCredentials();
  const envAdmin: PublicUser = {
    id: "env-admin",
    username: admin.username,
    name: admin.name,
    email: "",
    role: "Admin",
    createdAt: "",
    source: "env",
  };
  const users = [envAdmin, ...listUsers().map(toPublicUser)];
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  await ensureDbReady();
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    username?: string;
    password?: string;
    email?: string;
    role?: string;
  };

  const name = body.name?.trim() ?? "";
  const username = body.username?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const email = body.email?.trim() ?? "";
  const role = normalizeRole(body.role);
  const admin = getAuthCredentials();

  if (name.length < 2) {
    return NextResponse.json({ error: "Enter a full name." }, { status: 400 });
  }
  const usernameError = validateUsername(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (username === admin.username.toLowerCase()) {
    return NextResponse.json(
      { error: "That username is reserved for the system admin." },
      { status: 409 }
    );
  }
  if (findUserByUsername(username)) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  try {
    const user = createUser({ username, name, password, email, role });
    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (err) {
    console.error("[users] create failed", err);
    return NextResponse.json({ error: "Unable to create user." }, { status: 500 });
  }
}
