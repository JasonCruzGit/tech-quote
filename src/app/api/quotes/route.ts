import { NextResponse } from "next/server";
import { generateId, generateQuoteNumber } from "@/lib/id";
import { todayIso } from "@/lib/format";
import { insertQuote, listQuoteNumbers, listQuotes } from "@/lib/server/quotesRepo";
import type { Quote } from "@/lib/types";

export async function GET() {
  const quotes = listQuotes();
  return NextResponse.json({ quotes });
}

export async function POST() {
  const now = new Date().toISOString();
  const quote: Quote = {
    id: generateId(),
    quoteNumber: generateQuoteNumber(listQuoteNumbers()),
    date: todayIso(),
    status: "Draft",
    client: { name: "", office: "", address: "" },
    vatPct: 0.12,
    items: [],
    terms: {
      delivery: "Within 4-6 weeks upon receipt of PO",
      payment:
        "Thirty (30) days upon receipt of the invoice and upon complete/full submission",
      warranty: "1-yr Product Warranty and 1 month Service Warranty",
      pricesNote: "Prices are inclusive of applicable taxes unless otherwise stated.",
    },
    preparedBy: { name: "", title: "" },
    createdAt: now,
    updatedAt: now,
  };
  insertQuote(quote);
  return NextResponse.json({ quote }, { status: 201 });
}
