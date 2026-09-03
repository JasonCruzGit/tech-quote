import { NextResponse } from "next/server";
import { todayIso } from "@/lib/format";
import { generateId, generateQuoteNumber } from "@/lib/id";
import type { QuoteImportRow } from "@/lib/quoteImport";
import { insertQuote, listQuoteNumbers } from "@/lib/server/quotesRepo";
import type { LineItem, Quote, QuoteStatus } from "@/lib/types";

const DEFAULT_TERMS = {
  delivery: "Within 4-6 weeks upon receipt of PO",
  payment:
    "Thirty (30) days upon receipt of the invoice and upon complete/full submission",
  warranty: "1-yr Product Warranty and 1 month Service Warranty",
  pricesNote: "Prices are inclusive of applicable taxes unless otherwise stated.",
};

function splitLines(value?: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildLineItem(row: QuoteImportRow["items"][number]): LineItem {
  const unitPrice = row.unitPrice ?? 0;
  return {
    id: generateId(),
    title: row.title.trim() || "Untitled item",
    specs: splitLines(row.specs),
    inclusions: splitLines(row.inclusions),
    warranty: row.warranty?.trim() ?? "",
    qty: row.qty && row.qty > 0 ? row.qty : 1,
    unit: row.unit?.trim() || "unit",
    unitPrice,
    priceManuallySet: unitPrice > 0,
    supplierCost: row.supplierCost ?? 0,
    markupPct: row.markupPct ?? 0.3,
  };
}

function resolveQuoteNumber(requested: string | undefined, used: Set<string>): string {
  const trimmed = requested?.trim();
  if (trimmed && !used.has(trimmed)) {
    used.add(trimmed);
    return trimmed;
  }
  let next = generateQuoteNumber([...used]);
  while (used.has(next)) {
    next = generateQuoteNumber([...used, next]);
  }
  used.add(next);
  return next;
}

function toQuote(row: QuoteImportRow, quoteNumber: string, now: string): Quote {
  const status: QuoteStatus = row.status ?? "Draft";
  return {
    id: generateId(),
    quoteNumber,
    date: row.date || todayIso(),
    status,
    client: {
      name: row.clientName?.trim() ?? "",
      office: row.clientOffice?.trim() ?? "",
      address: row.clientAddress?.trim() ?? "",
    },
    items: row.items.map(buildLineItem),
    vatPct: 0.12,
    terms: DEFAULT_TERMS,
    preparedBy: {
      name: row.preparedByName?.trim() ?? "",
      title: row.preparedByTitle?.trim() ?? "",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { rows?: QuoteImportRow[] };
  const rows = body.rows ?? [];

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  const usedNumbers = new Set(listQuoteNumbers());
  const imported: Quote[] = [];
  const messages: string[] = [];
  let skipped = 0;
  const now = new Date().toISOString();

  for (const [index, row] of rows.entries()) {
    const hasContent =
      row.quoteNumber?.trim() ||
      row.clientName?.trim() ||
      row.clientOffice?.trim() ||
      row.items.length > 0;

    if (!hasContent) {
      skipped += 1;
      messages.push(`Row ${index + 1}: skipped (empty).`);
      continue;
    }

    const requested = row.quoteNumber?.trim();
    if (requested && usedNumbers.has(requested)) {
      skipped += 1;
      messages.push(`Row ${index + 1}: skipped duplicate quote number ${requested}.`);
      continue;
    }

    const quoteNumber = resolveQuoteNumber(requested, usedNumbers);
    const quote = toQuote(row, quoteNumber, now);
    insertQuote(quote);
    imported.push(quote);
  }

  return NextResponse.json({ imported, skipped, messages }, { status: 201 });
}
