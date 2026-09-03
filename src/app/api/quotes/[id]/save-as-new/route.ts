import { NextResponse } from "next/server";
import { generateId, generateQuoteNumber } from "@/lib/id";
import { todayIso } from "@/lib/format";
import {
  getQuoteById,
  insertQuote,
  listQuoteNumbers,
  replaceQuote,
} from "@/lib/server/quotesRepo";
import type { Quote } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SaveAsNewBody {
  draft: Quote;
  /** Snapshot of the quote when the editor was opened — restored so the original stays unchanged */
  restore: Quote;
}

function isBlankQuote(q: Quote): boolean {
  return (
    !q.client.name.trim() &&
    !q.client.office.trim() &&
    !q.client.address.trim() &&
    q.items.length === 0
  );
}

function cloneItems(items: Quote["items"]): Quote["items"] {
  return items.map((item) => ({ ...item, id: generateId() }));
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const source = getQuoteById(id);
  if (!source) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const body = (await request.json()) as SaveAsNewBody;
  if (!body?.draft || body.draft.id !== id) {
    return NextResponse.json({ error: "Invalid draft payload" }, { status: 400 });
  }
  if (!body.restore || body.restore.id !== id) {
    return NextResponse.json({ error: "Invalid restore payload" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Brand-new empty quotation: first save stays on the same record.
  if (isBlankQuote(body.restore)) {
    const saved: Quote = {
      ...body.draft,
      id,
      quoteNumber: source.quoteNumber,
      status: "Draft",
      updatedAt: now,
      createdAt: source.createdAt,
    };
    replaceQuote(saved);
    return NextResponse.json({ quote: saved, mode: "inplace" as const });
  }

  // Existing quotation updated: restore original, create new control number.
  const restored: Quote = {
    ...body.restore,
    id,
    quoteNumber: source.quoteNumber,
    updatedAt: now,
  };
  replaceQuote(restored);

  const next: Quote = {
    ...body.draft,
    id: generateId(),
    quoteNumber: generateQuoteNumber(listQuoteNumbers()),
    date: body.draft.date || todayIso(),
    status: "Draft",
    items: cloneItems(body.draft.items),
    createdAt: now,
    updatedAt: now,
  };
  insertQuote(next);

  return NextResponse.json({ quote: next, restored, mode: "new" as const }, { status: 201 });
}
