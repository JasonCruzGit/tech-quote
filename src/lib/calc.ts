import type { LineItem, Quote } from "./types";
import { inclusionsCostTotal } from "./inclusions";

/** Main supplier cost + priced inclusion costs (per unit). */
export function unitCost(
  item: Pick<LineItem, "supplierCost" | "inclusions">
): number {
  return (item.supplierCost || 0) + inclusionsCostTotal(item.inclusions ?? []);
}

/** Client-facing unit price including priced inclusions. */
export function effectiveUnitPrice(
  item: Pick<LineItem, "unitPrice" | "inclusions">
): number {
  return (item.unitPrice || 0) + inclusionsCostTotal(item.inclusions ?? []);
}

export function unitSellingPrice(
  item: Pick<LineItem, "supplierCost" | "markupPct" | "inclusions">
): number {
  return unitCost(item) * (1 + item.markupPct);
}

export function totalCost(
  item: Pick<LineItem, "supplierCost" | "qty" | "inclusions">
): number {
  return unitCost(item) * item.qty;
}

export function totalSellingPrice(
  item: Pick<LineItem, "supplierCost" | "markupPct" | "qty" | "inclusions">
): number {
  return unitSellingPrice(item) * item.qty;
}

export function lineTotalPrice(
  item: Pick<LineItem, "unitPrice" | "qty" | "inclusions">
): number {
  return effectiveUnitPrice(item) * item.qty;
}

export function markupAmount(
  item: Pick<LineItem, "unitPrice" | "supplierCost" | "qty" | "inclusions">
): number {
  return (effectiveUnitPrice(item) - unitCost(item)) * item.qty;
}

export function marginPct(
  item: Pick<LineItem, "unitPrice" | "supplierCost" | "inclusions">
): number {
  const sell = effectiveUnitPrice(item);
  if (!sell) return 0;
  return (sell - unitCost(item)) / sell;
}

export function suggestedMarginPct(
  item: Pick<LineItem, "supplierCost" | "markupPct" | "inclusions">
): number {
  const usp = unitSellingPrice(item);
  if (!usp) return 0;
  return (usp - unitCost(item)) / usp;
}

/**
 * Base unit price to store so that base + inclusion amounts = suggested USP.
 * Keeps inclusion amounts as add-ons on the quote total.
 */
export function baseUnitPriceFromSuggested(
  item: Pick<LineItem, "supplierCost" | "markupPct" | "inclusions">
): number {
  return Math.max(0, unitSellingPrice(item) - inclusionsCostTotal(item.inclusions ?? []));
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
