import { NextResponse } from "next/server";
import { getRfqById, removeRfq, replaceRfq } from "@/lib/server/rfqsRepo";
import type { Rfq } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const rfq = getRfqById(id);
  if (!rfq) {
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
  }
  return NextResponse.json({ rfq });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Rfq;
  if (body.id !== id) {
    return NextResponse.json({ error: "RFQ id mismatch" }, { status: 400 });
  }
  const updated = replaceRfq({
    ...body,
    abc: Number.isFinite(body.abc) ? body.abc : 0,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
  }
  return NextResponse.json({ rfq: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!removeRfq(id)) {
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
