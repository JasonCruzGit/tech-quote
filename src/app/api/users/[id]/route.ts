import { NextResponse } from "next/server";
import {
  deleteUser,
  findUserById,
  toPublicUser,
  updateUser,
} from "@/lib/server/authUsers";
import { ensureDbReady } from "@/lib/server/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  if (id === "env-admin") {
    return NextResponse.json(
      { error: "System admin is managed via environment variables." },
      { status: 400 }
    );
  }

  const existing = findUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    password?: string;
  };

  const name = body.name?.trim();
  const password = body.password;

  if (name !== undefined && name.length < 2) {
    return NextResponse.json({ error: "Enter a full name." }, { status: 400 });
  }
  if (password !== undefined && password.length > 0 && password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const updated = updateUser(id, {
    name,
    password: password && password.length > 0 ? password : undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user: toPublicUser(updated) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  if (id === "env-admin") {
    return NextResponse.json(
      { error: "System admin cannot be deleted." },
      { status: 400 }
    );
  }
  if (!deleteUser(id)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
