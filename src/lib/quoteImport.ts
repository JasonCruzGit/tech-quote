import { todayIso } from "./format";
import type { QuoteStatus } from "./types";

/** One quotation parsed from a spreadsheet row (or merged rows). */
export interface QuoteImportRow {
  quoteNumber?: string;
  date?: string;
  status?: QuoteStatus;
  clientName?: string;
  clientOffice?: string;
  clientAddress?: string;
  preparedByName?: string;
  preparedByTitle?: string;
  items: QuoteImportItemRow[];
}

export interface QuoteImportItemRow {
  title: string;
  qty?: number;
  unit?: string;
  unitPrice?: number;
  supplierCost?: number;
  markupPct?: number;
  specs?: string;
  inclusions?: string;
  warranty?: string;
}

const HEADER_ALIASES: Record<string, string> = {
  "quotation no": "quoteNumber",
  "quote no": "quoteNumber",
  "quote number": "quoteNumber",
  "quotation number": "quoteNumber",
  ref: "quoteNumber",
  reference: "quoteNumber",

  "customer name": "clientName",
  customer: "clientName",
  client: "clientName",
  "contact person": "clientName",
  contact: "clientName",
  "client name": "clientName",

  office: "clientOffice",
  "client office": "clientOffice",
  department: "clientOffice",
  agency: "clientOffice",

  address: "clientAddress",
  "client address": "clientAddress",

  date: "date",
  "quotation date": "date",
  "quote date": "date",

  status: "status",

  "quotation by": "preparedByName",
  "prepared by": "preparedByName",
  "prepared by name": "preparedByName",

  title: "preparedByTitle",
  "prepared by title": "preparedByTitle",
  position: "preparedByTitle",

  item: "itemTitle",
  items: "itemTitle",
  "item title": "itemTitle",
  product: "itemTitle",
  description: "itemTitle",

  qty: "qty",
  quantity: "qty",

  unit: "unit",
  uom: "unit",

  "unit price": "unitPrice",
  price: "unitPrice",
  amount: "unitPrice",

  "supplier cost": "supplierCost",
  cost: "supplierCost",

  markup: "markupPct",
  "markup pct": "markupPct",
  "markup percent": "markupPct",
  margin: "markupPct",

  specs: "specs",
  specifications: "specs",
  inclusions: "inclusions",
  inclusion: "inclusions",
  warranty: "warranty",
};

const STATUSES: QuoteStatus[] = ["Draft", "Sent", "Approved", "Won"];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function mapHeaders(row: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const field = HEADER_ALIASES[normalizeHeader(key)];
    if (field) mapped[field] = value;
  }
  return mapped;
}

function parseStatus(value: unknown): QuoteStatus | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const found = STATUSES.find((s) => s.toLowerCase() === raw.toLowerCase());
  return found;
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[₱,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseMarkup(value: unknown): number | undefined {
  const n = parseNumber(value);
  if (n === undefined) return undefined;
  // Accept "30" or "0.3" for 30% markup.
  return n > 1 ? n / 100 : n;
}

function parseExcelDate(value: unknown, xlsx: typeof import("xlsx")): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && xlsx.SSF?.parse_date_code) {
    const parts = xlsx.SSF.parse_date_code(value);
    if (parts) {
      return `${parts.y}-${String(parts.m).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
    }
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

function splitList(value: unknown): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function itemFromTitle(title: string): QuoteImportItemRow {
  return { title };
}

function rowHasQuoteData(mapped: Record<string, unknown>): boolean {
  return Boolean(
    String(mapped.quoteNumber ?? "").trim() ||
      String(mapped.clientName ?? "").trim() ||
      String(mapped.clientOffice ?? "").trim() ||
      String(mapped.itemTitle ?? "").trim()
  );
}

function mergeQuoteRow(
  existing: QuoteImportRow | undefined,
  mapped: Record<string, unknown>,
  xlsx: typeof import("xlsx")
): QuoteImportRow {
  const next: QuoteImportRow = existing ?? {
    items: [],
  };

  const quoteNumber = String(mapped.quoteNumber ?? "").trim();
  if (quoteNumber) next.quoteNumber = quoteNumber;

  const date = parseExcelDate(mapped.date, xlsx);
  if (date) next.date = date;

  const status = parseStatus(mapped.status);
  if (status) next.status = status;

  const clientName = String(mapped.clientName ?? "").trim();
  if (clientName) next.clientName = clientName;

  const clientOffice = String(mapped.clientOffice ?? "").trim();
  if (clientOffice) next.clientOffice = clientOffice;

  const clientAddress = String(mapped.clientAddress ?? "").trim();
  if (clientAddress) next.clientAddress = clientAddress;

  const preparedByName = String(mapped.preparedByName ?? "").trim();
  if (preparedByName) next.preparedByName = preparedByName;

  const preparedByTitle = String(mapped.preparedByTitle ?? "").trim();
  if (preparedByTitle) next.preparedByTitle = preparedByTitle;

  const itemTitle = String(mapped.itemTitle ?? "").trim();
  if (itemTitle) {
    if (!mapped.qty && !mapped.unitPrice && itemTitle.includes(";")) {
      for (const title of splitList(itemTitle)) {
        next.items.push(itemFromTitle(title));
      }
    } else {
      next.items.push({
        title: itemTitle,
        qty: parseNumber(mapped.qty),
        unit: String(mapped.unit ?? "").trim() || undefined,
        unitPrice: parseNumber(mapped.unitPrice),
        supplierCost: parseNumber(mapped.supplierCost),
        markupPct: parseMarkup(mapped.markupPct),
        specs: String(mapped.specs ?? "").trim() || undefined,
        inclusions: String(mapped.inclusions ?? "").trim() || undefined,
        warranty: String(mapped.warranty ?? "").trim() || undefined,
      });
    }
  }

  return next;
}

/** Reads the first worksheet of an Excel/CSV file into import rows. */
export async function parseQuoteSpreadsheet(file: File): Promise<QuoteImportRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });

  const groups = new Map<string, QuoteImportRow>();

  rawRows.forEach((row, index) => {
    const mapped = mapHeaders(row);
    if (!rowHasQuoteData(mapped)) return;

    const quoteNumber = String(mapped.quoteNumber ?? "").trim();
    const clientName = String(mapped.clientName ?? "").trim();
    const dateKey = parseExcelDate(mapped.date, XLSX) ?? "";
    const key = quoteNumber || `${clientName}|${dateKey}|${index}`;

    const merged = mergeQuoteRow(groups.get(key), mapped, XLSX);
    if (!merged.date) merged.date = todayIso();
    groups.set(key, merged);
  });

  return [...groups.values()].filter(
    (q) =>
      q.quoteNumber ||
      q.clientName ||
      q.clientOffice ||
      q.items.length > 0
  );
}
