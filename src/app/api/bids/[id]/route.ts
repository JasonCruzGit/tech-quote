import { NextResponse } from "next/server";
import { getBidById, removeBid, replaceBid } from "@/lib/server/bidsRepo";
import type { Bid } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const bid = getBidById(id);
  if (!bid) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }
  return NextResponse.json({ bid });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Bid;
  if (body.id !== id) {
    return NextResponse.json({ error: "Bid id mismatch" }, { status: 400 });
  }
  const updated = replaceBid({
    ...body,
    abc: safeNumber(body.abc),
    bidAmount: safeNumber(body.bidAmount),
    bidBondAmount: safeNumber(body.bidBondAmount),
    awardAmount: safeNumber(body.awardAmount),
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }
  return NextResponse.json({ bid: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!removeBid(id)) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
