import type { LineItem, Quote } from "./types";

export function unitSellingPrice(item: Pick<LineItem, "supplierCost" | "markupPct">): number {
  return item.supplierCost * (1 + item.markupPct);
}

export function totalCost(item: Pick<LineItem, "supplierCost" | "qty">): number {
  return item.supplierCost * item.qty;
}

export function totalSellingPrice(item: Pick<LineItem, "supplierCost" | "markupPct" | "qty">): number {
  return unitSellingPrice(item) * item.qty;
}

export function lineTotalPrice(item: Pick<LineItem, "unitPrice" | "qty">): number {
  return item.unitPrice * item.qty;
}

export function markupAmount(item: Pick<LineItem, "unitPrice" | "supplierCost" | "qty">): number {
  return (item.unitPrice - item.supplierCost) * item.qty;
}

export function marginPct(item: Pick<LineItem, "unitPrice" | "supplierCost">): number {
  if (!item.unitPrice) return 0;
  return (item.unitPrice - item.supplierCost) / item.unitPrice;
}

export function suggestedMarginPct(item: Pick<LineItem, "supplierCost" | "markupPct">): number {
  const usp = unitSellingPrice(item);
  if (!usp) return 0;
  return (usp - item.supplierCost) / usp;
}

export interface QuoteTotals {
  subtotal: number;
  vat: number;
  grandTotal: number;
  totalCost: number;
  totalSellingPrice: number;
  totalMarkup: number;
  overallMarginPct: number;
}

export function computeQuoteTotals(quote: Pick<Quote, "items" | "vatPct">): QuoteTotals {
  let subtotal = 0;
  let cost = 0;
  let selling = 0;
  let markup = 0;

  for (const item of quote.items) {
    subtotal += lineTotalPrice(item);
    cost += totalCost(item);
    selling += totalSellingPrice(item);
    markup += markupAmount(item);
  }

  const vat = subtotal * quote.vatPct;
  const grandTotal = subtotal + vat;

  return {
    subtotal,
    vat,
    grandTotal,
    totalCost: cost,
    totalSellingPrice: selling,
    totalMarkup: markup,
    overallMarginPct: subtotal ? markup / subtotal : 0,
  };
}
