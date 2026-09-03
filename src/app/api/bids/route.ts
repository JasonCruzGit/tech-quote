import { NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { insertBid, listBids } from "@/lib/server/bidsRepo";
import type { Bid } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ bids: listBids() });
}

export async function POST(request: Request) {
  // Optional seed values let a bid be opened directly from an RFQ.
  const seed = (await request
    .json()
    .catch(() => ({}))) as Partial<Bid>;

  const now = new Date().toISOString();
  const bid: Bid = {
    id: generateId(),
    referenceNumber: seed.referenceNumber ?? "",
    title: seed.title ?? "",
    clientOffice: seed.clientOffice ?? "",
    abc: seed.abc ?? 0,
    bidAmount: seed.bidAmount ?? 0,
    bidBondAmount: seed.bidBondAmount ?? 0,
    bidBondPosted: seed.bidBondPosted ?? false,
    preBidDate: seed.preBidDate ?? "",
    openingDate: seed.openingDate ?? "",
    status: "Preparing",
    awardedTo: "",
    awardAmount: 0,
    notes: seed.notes ?? "",
    rfqId: seed.rfqId ?? null,
    quoteId: seed.quoteId ?? null,
    quoteNumber: seed.quoteNumber ?? null,
    projectId: null,
    createdAt: now,
    updatedAt: now,
  };
  insertBid(bid);
  return NextResponse.json({ bid }, { status: 201 });
}
