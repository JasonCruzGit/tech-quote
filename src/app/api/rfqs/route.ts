import { NextResponse } from "next/server";
import { todayIso } from "@/lib/format";
import { generateId } from "@/lib/id";
import { insertRfq, listRfqs } from "@/lib/server/rfqsRepo";
import type { Rfq } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ rfqs: listRfqs() });
}

export async function POST() {
  const now = new Date().toISOString();
  const rfq: Rfq = {
    id: generateId(),
    rfqNumber: "",
    title: "",
    clientName: "",
    clientOffice: "",
    clientAddress: "",
    dateReceived: todayIso(),
    deadline: "",
    abc: 0,
    modeOfProcurement: "Small Value Procurement",
    status: "New",
    notes: "",
    quoteId: null,
    quoteNumber: null,
    createdAt: now,
    updatedAt: now,
  };
  insertRfq(rfq);
  return NextResponse.json({ rfq }, { status: 201 });
}
