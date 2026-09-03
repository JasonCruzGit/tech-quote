import { NextResponse } from "next/server";
import { todayIso } from "@/lib/format";
import { generateId, generateQuoteNumber } from "@/lib/id";
import { insertQuote, listQuoteNumbers, getQuoteById } from "@/lib/server/quotesRepo";
import { getRfqById, replaceRfq } from "@/lib/server/rfqsRepo";
import type { Quote } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Creates the quotation prepared in response to an RFQ, carrying client details over. */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const rfq = getRfqById(id);
  if (!rfq) {
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
  }

  // Reuse the existing quotation if this RFQ was already converted.
  if (rfq.quoteId) {
    const existing = getQuoteById(rfq.quoteId);
    if (existing) {
      return NextResponse.json({ quote: existing, rfq, alreadyExists: true });
    }
  }

  const now = new Date().toISOString();
  const quote: Quote = {
    id: generateId(),
    quoteNumber: generateQuoteNumber(listQuoteNumbers()),
    date: todayIso(),
    status: "Draft",
    client: {
      name: rfq.clientName,
      office: rfq.clientOffice,
      address: rfq.clientAddress,
    },
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

  const updatedRfq =
    replaceRfq({
      ...rfq,
      status: rfq.status === "New" ? "Quoted" : rfq.status,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      updatedAt: now,
    }) ?? rfq;

  return NextResponse.json(
    { quote, rfq: updatedRfq, alreadyExists: false },
    { status: 201 }
  );
}
