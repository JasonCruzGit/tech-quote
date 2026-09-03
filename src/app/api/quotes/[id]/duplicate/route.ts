import { NextResponse } from "next/server";
import { generateId, generateQuoteNumber } from "@/lib/id";
import { todayIso } from "@/lib/format";
import { getQuoteById, insertQuote, listQuoteNumbers } from "@/lib/server/quotesRepo";
import type { Quote } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const source = getQuoteById(id);
  if (!source) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const copy: Quote = {
    ...source,
    id: generateId(),
    quoteNumber: generateQuoteNumber(listQuoteNumbers()),
    date: todayIso(),
    status: "Draft",
    items: source.items.map((item) => ({ ...item, id: generateId() })),
    createdAt: now,
    updatedAt: now,
  };
  insertQuote(copy);
  return NextResponse.json({ quote: copy }, { status: 201 });
}
