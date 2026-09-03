import { NextResponse } from "next/server";
import { listRecentClients } from "@/lib/server/quotesRepo";

export async function GET() {
  const clients = listRecentClients();
  return NextResponse.json({ clients });
}
