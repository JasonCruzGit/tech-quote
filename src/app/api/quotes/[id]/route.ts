import { NextResponse } from "next/server";
import { ensureDbReady, flushPersist } from "@/lib/server/db";
import { getQuoteById, removeQuote, replaceQuote } from "@/lib/server/quotesRepo";
import type { Quote } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const quote = getQuoteById(id);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  return NextResponse.json({ quote });
}

export async function PUT(request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const body = (await request.json()) as Quote;

  if (body.id !== id) {
    return NextResponse.json({ error: "Quote id mismatch" }, { status: 400 });
  }

  const updated = replaceQuote({ ...body, updatedAt: new Date().toISOString() });
  if (!updated) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  await flushPersist();
  return NextResponse.json({ quote: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const removed = removeQuote(id);
  if (!removed) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  await flushPersist();
  return NextResponse.json({ ok: true });
}
