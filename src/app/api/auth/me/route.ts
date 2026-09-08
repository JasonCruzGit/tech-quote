import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth";

export async function GET() {
  const jar = await cookies();
  const user = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
