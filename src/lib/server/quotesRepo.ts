import { buildSampleQuote } from "@/lib/sampleData";
import type { Client, Quote } from "@/lib/types";
import db from "./db";

interface QuoteRow {
  id: string;
  quoteNumber: string;
  date: string;
  status: string;
  vatPct: number;
  client: string;
  items: string;
  terms: string;
  preparedBy: string;
  createdAt: string;
  updatedAt: string;
}

function rowToQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    quoteNumber: row.quoteNumber,
    date: row.date,
    status: row.status as Quote["status"],
    vatPct: row.vatPct,
    client: JSON.parse(row.client),
    items: JSON.parse(row.items),
    terms: JSON.parse(row.terms),
    preparedBy: JSON.parse(row.preparedBy),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function quoteToRow(q: Quote): QuoteRow {
  return {
    id: q.id,
    quoteNumber: q.quoteNumber,
    date: q.date,
    status: q.status,
    vatPct: q.vatPct,
    client: JSON.stringify(q.client),
    items: JSON.stringify(q.items),
    terms: JSON.stringify(q.terms),
    preparedBy: JSON.stringify(q.preparedBy),
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

function seedIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) as c FROM quotes").get() as { c: number }).c;
  if (count === 0) {
    insertQuote(buildSampleQuote());
  }
}

export function listQuotes(): Quote[] {
  seedIfEmpty();
  const rows = db.prepare("SELECT * FROM quotes ORDER BY updatedAt DESC").all() as QuoteRow[];
  return rows.map(rowToQuote);
}

export function getQuoteById(id: string): Quote | undefined {
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as QuoteRow | undefined;
  return row ? rowToQuote(row) : undefined;
}

export function listQuoteNumbers(): string[] {
  const rows = db.prepare("SELECT quoteNumber FROM quotes").all() as { quoteNumber: string }[];
  return rows.map((r) => r.quoteNumber);
}

export function insertQuote(quote: Quote): Quote {
  const row = quoteToRow(quote);
  db.prepare(
    `INSERT INTO quotes (id, quoteNumber, date, status, vatPct, client, items, terms, preparedBy, createdAt, updatedAt)
     VALUES (@id, @quoteNumber, @date, @status, @vatPct, @client, @items, @terms, @preparedBy, @createdAt, @updatedAt)`
  ).run(row);
  return quote;
}

export function replaceQuote(quote: Quote): Quote | undefined {
  const existing = getQuoteById(quote.id);
  if (!existing) return undefined;
  const row = quoteToRow(quote);
  db.prepare(
    `UPDATE quotes SET quoteNumber=@quoteNumber, date=@date, status=@status, vatPct=@vatPct,
       client=@client, items=@items, terms=@terms, preparedBy=@preparedBy, updatedAt=@updatedAt
     WHERE id=@id`
  ).run(row);
  return quote;
}

export function removeQuote(id: string): boolean {
  const result = db.prepare("DELETE FROM quotes WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listRecentClients(limit = 12): Client[] {
  seedIfEmpty();
  const rows = db.prepare("SELECT client FROM quotes ORDER BY updatedAt DESC").all() as {
    client: string;
  }[];
  const seen = new Set<string>();
  const clients: Client[] = [];
  for (const row of rows) {
    const client = JSON.parse(row.client) as Client;
    const key = client.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    clients.push(client);
    if (clients.length >= limit) break;
  }
  return clients;
}
