import { generateId } from "@/lib/id";
import type { Project, Quote } from "@/lib/types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Build a delivery project from a won quotation. */
export function buildProjectFromQuote(quote: Quote): Project {
  const now = new Date().toISOString();
  const itemLines = quote.items
    .map((item) => {
      const title = item.title.trim() || "Untitled item";
      return `• ${title} (${item.qty} ${item.unit || "unit"})`;
    })
    .join("\n");

  const name =
    quote.client.office.trim() ||
    quote.client.name.trim() ||
    `Project ${quote.quoteNumber}`;

  const descriptionParts = [
    `Won from quotation ${quote.quoteNumber}.`,
    quote.client.address.trim() ? `Address: ${quote.client.address.trim()}` : "",
    itemLines ? `Items:\n${itemLines}` : "",
  ].filter(Boolean);

  return {
    id: generateId(),
    name,
    clientName: quote.client.name.trim(),
    clientOffice: quote.client.office.trim(),
    description: descriptionParts.join("\n\n"),
    status: "Ongoing",
    progressPct: 0,
    startDate: todayIsoDate(),
    targetDate: "",
    quoteId: quote.id,
    quoteNumber: quote.quoteNumber,
    createdAt: now,
    updatedAt: now,
  };
}
